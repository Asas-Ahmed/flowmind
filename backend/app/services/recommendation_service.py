from collections import Counter
from datetime import datetime, timedelta, timezone
from statistics import mean

from sqlalchemy.orm import Session

from app.models.cognitive_load import CognitiveLoadEntry
from app.models.distraction_log import DistractionLog
from app.models.energy_checkin import EnergyCheckIn
from app.models.focus_session import FocusSession
from app.models.habit import Habit, HabitCompletion
from app.models.schedule_event import ScheduleEvent
from app.models.sleep_record import SleepRecord
from app.models.task import Task
from app.models.user import User
from app.services.task_risk_service import predict_open_tasks

_PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}


def _confidence(sample_size: int) -> str:
    if sample_size >= 10:
        return "high"
    if sample_size >= 4:
        return "medium"
    return "early"


def _recommendation(
    *,
    recommendation_id: str,
    title: str,
    message: str,
    reason: str,
    category: str,
    priority: str,
    confidence: str,
    impact: str,
    evidence: list[dict[str, str]],
    action_label: str,
    action_href: str,
) -> dict:
    return {
        "id": recommendation_id,
        "title": title,
        "message": message,
        "reason": reason,
        "category": category,
        "priority": priority,
        "confidence": confidence,
        "impact": impact,
        "evidence": evidence,
        "action": {"label": action_label, "href": action_href},
    }


def build_recommendation_workspace(
    db: Session,
    current_user: User,
    *,
    horizon_days: int = 7,
):
    now = datetime.now(timezone.utc)
    today = now.date()
    recent_start = now - timedelta(days=14)
    upcoming_end = now + timedelta(days=horizon_days)

    open_tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id, Task.status != "completed")
        .all()
    )
    recent_completed_tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id, Task.completed_at >= recent_start)
        .all()
    )
    recent_focus = (
        db.query(FocusSession)
        .filter(
            FocusSession.user_id == current_user.id,
            FocusSession.status == "completed",
            FocusSession.completed_at >= recent_start,
        )
        .all()
    )
    active_habits = (
        db.query(Habit)
        .filter(Habit.user_id == current_user.id, Habit.is_archived.is_(False))
        .all()
    )
    recent_habit_completions = (
        db.query(HabitCompletion)
        .filter(
            HabitCompletion.user_id == current_user.id,
            HabitCompletion.completion_date >= today - timedelta(days=6),
        )
        .all()
    )
    upcoming_events = (
        db.query(ScheduleEvent)
        .filter(
            ScheduleEvent.user_id == current_user.id,
            ScheduleEvent.start_at >= now,
            ScheduleEvent.start_at <= upcoming_end,
        )
        .order_by(ScheduleEvent.start_at.asc())
        .all()
    )
    energy_checkins = (
        db.query(EnergyCheckIn)
        .filter(EnergyCheckIn.user_id == current_user.id, EnergyCheckIn.checked_at >= recent_start)
        .order_by(EnergyCheckIn.checked_at.desc())
        .all()
    )
    sleep_records = (
        db.query(SleepRecord)
        .filter(SleepRecord.user_id == current_user.id, SleepRecord.sleep_date >= today - timedelta(days=13))
        .all()
    )
    cognitive_entries = (
        db.query(CognitiveLoadEntry)
        .filter(CognitiveLoadEntry.user_id == current_user.id, CognitiveLoadEntry.entry_date >= today)
        .all()
    )
    distractions = (
        db.query(DistractionLog)
        .filter(DistractionLog.user_id == current_user.id, DistractionLog.occurred_at >= recent_start)
        .all()
    )

    recommendations: list[dict] = []

    try:
        risk_workspace = predict_open_tasks(db, current_user.id)
        highest_risk = risk_workspace.predictions[0] if risk_workspace.predictions else None
    except Exception:
        risk_workspace = None
        highest_risk = None

    if highest_risk and highest_risk.risk_level in {"high", "medium"}:
        recommendations.append(_recommendation(
            recommendation_id="ml-task-risk",
            title=f"Protect: {highest_risk.task_title}",
            message=highest_risk.recommended_action,
            reason="The trained FlowMind model combined task pressure with your recent focus, habit, workload, and wellbeing signals.",
            category="AI task forecast",
            priority="high" if highest_risk.risk_level == "high" else "medium",
            confidence="high",
            impact="completion-risk",
            evidence=[
                {"label": "Predicted risk", "value": f"{round(highest_risk.risk_probability * 100)}%"},
                {"label": "Main factor", "value": highest_risk.important_factors[0] if highest_risk.important_factors else "Combined signals"},
            ],
            action_label="Review task forecast",
            action_href="/tasks",
        ))

    overdue = [task for task in open_tasks if task.due_at and task.due_at < now]
    due_soon = [task for task in open_tasks if task.due_at and now <= task.due_at <= upcoming_end]
    urgent_important = [task for task in open_tasks if task.eisenhower == "important_urgent"]
    if overdue or urgent_important:
        count = len({task.id for task in overdue + urgent_important})
        recommendations.append(_recommendation(
            recommendation_id="priority-reset",
            title="Reset your immediate priorities",
            message=f"Choose one of your {count} urgent or overdue tasks as the next concrete action.",
            reason="A smaller active priority set reduces switching and makes deadline risk visible.",
            category="Tasks",
            priority="high",
            confidence=_confidence(len(open_tasks)),
            impact="planning",
            evidence=[
                {"label": "Overdue", "value": str(len(overdue))},
                {"label": "Urgent & important", "value": str(len(urgent_important))},
            ],
            action_label="Review priority tasks",
            action_href="/tasks",
        ))
    elif due_soon:
        recommendations.append(_recommendation(
            recommendation_id="deadline-plan",
            title="Protect time for upcoming deadlines",
            message=f"You have {len(due_soon)} task{'s' if len(due_soon) != 1 else ''} due within the next {horizon_days} days.",
            reason="Scheduling deadline work before the final day creates recovery room for interruptions.",
            category="Planning",
            priority="medium",
            confidence=_confidence(len(due_soon)),
            impact="planning",
            evidence=[
                {"label": "Due soon", "value": str(len(due_soon))},
                {"label": "Scheduled events", "value": str(len(upcoming_events))},
            ],
            action_label="Open smart schedule",
            action_href="/schedule",
        ))

    focus_minutes = sum(max(0, round(item.elapsed_seconds / 60)) for item in recent_focus)
    average_focus = round(mean([item.elapsed_seconds / 60 for item in recent_focus])) if recent_focus else 0
    if open_tasks and focus_minutes < 100:
        recommended_length = min(45, max(20, average_focus or 25))
        recommendations.append(_recommendation(
            recommendation_id="start-focus",
            title="Create a protected focus block",
            message=f"Start a {recommended_length}-minute session for your highest-value open task.",
            reason="Your current task load is higher than your recent recorded focused-work volume.",
            category="Focus",
            priority="high" if overdue else "medium",
            confidence=_confidence(len(recent_focus)),
            impact="focus",
            evidence=[
                {"label": "14-day focus", "value": f"{focus_minutes} min"},
                {"label": "Open tasks", "value": str(len(open_tasks))},
            ],
            action_label="Start focus session",
            action_href="/focus",
        ))

    if active_habits:
        expected = len(active_habits) * 7
        completed = len(recent_habit_completions)
        consistency = round((completed / expected) * 100) if expected else 0
        if consistency < 60:
            recommendations.append(_recommendation(
                recommendation_id="habit-recovery",
                title="Recover one keystone habit",
                message="Choose one small habit to complete consistently before adding more pressure.",
                reason="Recent habit completion is below your active habit plan, so narrowing the target may improve follow-through.",
                category="Habits",
                priority="medium",
                confidence=_confidence(completed),
                impact="consistency",
                evidence=[
                    {"label": "7-day consistency", "value": f"{consistency}%"},
                    {"label": "Active habits", "value": str(len(active_habits))},
                ],
                action_label="Review habits",
                action_href="/habits",
            ))

    latest_energy = energy_checkins[0] if energy_checkins else None
    if latest_energy and (latest_energy.energy_level <= 2 or latest_energy.stress_level >= 4):
        recommendations.append(_recommendation(
            recommendation_id="capacity-adjustment",
            title="Match today’s plan to your capacity",
            message="Reduce task intensity, use a shorter focus block, and protect one recovery break.",
            reason="Your latest check-in indicates limited energy or elevated stress, so a lighter plan is more sustainable.",
            category="Energy",
            priority="high",
            confidence=_confidence(len(energy_checkins)),
            impact="wellbeing",
            evidence=[
                {"label": "Energy", "value": f"{latest_energy.energy_level}/5"},
                {"label": "Stress", "value": f"{latest_energy.stress_level}/5"},
            ],
            action_label="Open energy check-in",
            action_href="/energy",
        ))

    if len(sleep_records) >= 3:
        average_sleep = mean(item.duration_hours for item in sleep_records)
        average_quality = mean(item.quality for item in sleep_records)
        if average_sleep < 7 or average_quality < 3:
            recommendations.append(_recommendation(
                recommendation_id="recovery-protection",
                title="Protect recovery before increasing workload",
                message="Keep demanding work inside your best hours and avoid extending the day to catch up.",
                reason="Your recent sleep duration or quality suggests that recovery should influence planning.",
                category="Recovery",
                priority="medium",
                confidence=_confidence(len(sleep_records)),
                impact="wellbeing",
                evidence=[
                    {"label": "Average sleep", "value": f"{average_sleep:.1f} h"},
                    {"label": "Average quality", "value": f"{average_quality:.1f}/5"},
                ],
                action_label="Review sleep pattern",
                action_href="/sleep",
            ))

    difficult_load = sum(item.estimated_minutes for item in cognitive_entries if item.difficulty in {"hard", "very_hard"})
    scheduled_minutes = sum(max(0, round((item.end_at - item.start_at).total_seconds() / 60)) for item in upcoming_events)
    if difficult_load >= 180 or scheduled_minutes >= horizon_days * 360:
        recommendations.append(_recommendation(
            recommendation_id="workload-buffer",
            title="Add breathing room to the plan",
            message="Move or split one demanding commitment and preserve transition time between work blocks.",
            reason="The upcoming cognitive or scheduled workload is dense enough to increase spillover risk.",
            category="Workload",
            priority="high" if difficult_load >= 300 else "medium",
            confidence=_confidence(len(cognitive_entries) + len(upcoming_events)),
            impact="planning",
            evidence=[
                {"label": "Difficult load", "value": f"{difficult_load} min"},
                {"label": "Scheduled time", "value": f"{scheduled_minutes} min"},
            ],
            action_label="Review workload warning",
            action_href="/burnout",
        ))

    if distractions:
        total_lost = sum(item.minutes_lost for item in distractions)
        common_type, common_count = Counter(item.distraction_type for item in distractions).most_common(1)[0]
        if total_lost >= 45:
            recommendations.append(_recommendation(
                recommendation_id="distraction-barrier",
                title=f"Create a barrier for {common_type.lower()}",
                message="Use one preventive action before your next focus block instead of relying on willpower during it.",
                reason="Your explicit distraction logs show a repeated source of lost time.",
                category="Distractions",
                priority="medium",
                confidence=_confidence(len(distractions)),
                impact="focus",
                evidence=[
                    {"label": "Minutes lost", "value": str(total_lost)},
                    {"label": "Repeated type", "value": f"{common_type} × {common_count}"},
                ],
                action_label="Open distraction log",
                action_href="/distractions",
            ))

    if not recommendations:
        recommendations.append(_recommendation(
            recommendation_id="balanced-next-step",
            title="Keep the next action simple",
            message="Choose one meaningful task, complete one focused block, and review the result afterward.",
            reason="Your current signals do not show an urgent workload, recovery, or consistency warning.",
            category="Flow",
            priority="low",
            confidence="medium" if recent_completed_tasks or recent_focus else "early",
            impact="focus",
            evidence=[
                {"label": "Open tasks", "value": str(len(open_tasks))},
                {"label": "Recent completions", "value": str(len(recent_completed_tasks))},
            ],
            action_label="Open dashboard",
            action_href="/dashboard",
        ))

    recommendations.sort(key=lambda item: (_PRIORITY_ORDER[item["priority"]], item["category"]))
    recommendations = recommendations[:8]

    signals = (
        len(open_tasks)
        + len(recent_completed_tasks)
        + len(recent_focus)
        + len(active_habits)
        + len(recent_habit_completions)
        + len(upcoming_events)
        + len(energy_checkins)
        + len(sleep_records)
        + len(cognitive_entries)
        + len(distractions)
    )
    connected_modules = sum(bool(items) for items in [
        open_tasks or recent_completed_tasks,
        recent_focus,
        active_habits or recent_habit_completions,
        upcoming_events,
        energy_checkins,
        sleep_records,
        cognitive_entries,
        distractions,
    ])
    readiness_score = min(100, round((connected_modules / 8) * 70 + min(signals, 30)))
    high_priority_count = sum(item["priority"] == "high" for item in recommendations)

    data_gaps = []
    if not energy_checkins:
        data_gaps.append("Add an energy check-in so recommendations can adapt to current capacity.")
    if not sleep_records:
        data_gaps.append("Log sleep to include recovery-aware planning guidance.")
    if not recent_focus:
        data_gaps.append("Complete focus sessions to personalize recommended block length.")
    if not distractions:
        data_gaps.append("Log interruptions to identify repeatable focus barriers.")

    headline = "Your next best actions are ready"
    if high_priority_count:
        headline = f"{high_priority_count} priority recommendation{'s' if high_priority_count != 1 else ''} need attention"

    return {
        "generated_at": now,
        "horizon_days": horizon_days,
        "headline": headline,
        "summary": f"FlowMind combined {signals} recent signals across {connected_modules} connected modules, including trained task-risk forecasts when active tasks were available.",
        "readiness_score": readiness_score,
        "signals_analyzed": signals,
        "high_priority_count": high_priority_count,
        "recommendations": recommendations,
        "data_gaps": data_gaps,
        "disclaimer": "Guidance combines explainable rules with trained task-completion-risk predictions. It supports planning and is not medical, psychological, or professional advice.",
    }
