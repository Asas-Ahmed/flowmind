from datetime import date, datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.focus_session import FocusSession
from app.models.habit import Habit, HabitCompletion
from app.models.task import Task
from app.models.user import User
from app.models.user_profile import UserProfile

DEFAULT_TIMEZONE = "Asia/Colombo"
DEFAULT_FOCUS_GOAL_MINUTES = 120


def _user_timezone(timezone_name: str | None) -> ZoneInfo:
    try:
        return ZoneInfo(timezone_name or DEFAULT_TIMEZONE)
    except ZoneInfoNotFoundError:
        return ZoneInfo(DEFAULT_TIMEZONE)


def _as_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _day_bounds(day: date, user_timezone: ZoneInfo) -> tuple[datetime, datetime]:
    local_start = datetime.combine(day, time.min, tzinfo=user_timezone)
    local_end = local_start + timedelta(days=1)
    return local_start.astimezone(timezone.utc), local_end.astimezone(timezone.utc)


def _in_range(value: datetime | None, start: datetime, end: datetime) -> bool:
    utc_value = _as_utc(value)
    return utc_value is not None and start <= utc_value < end


def _clamp(value: float) -> int:
    return max(0, min(100, round(value)))


def _is_habit_due(habit: Habit, target: date) -> bool:
    if habit.start_date > target or (habit.end_date and habit.end_date < target):
        return False
    if habit.frequency == "daily":
        return True
    if habit.frequency == "weekdays":
        return target.weekday() < 5
    if habit.frequency in {"weekly", "custom"}:
        return target.weekday() in (habit.scheduled_days or [])
    return True


def _level(score: int) -> str:
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Strong"
    if score >= 50:
        return "Building"
    if score >= 25:
        return "Low"
    return "Getting started"


def _daily_metrics(
    day: date,
    tasks: list[Task],
    habits: list[Habit],
    completions: dict[tuple[int, date], int],
    sessions: list[FocusSession],
    focus_goal: int,
    user_timezone: ZoneInfo,
    now_utc: datetime,
) -> dict:
    start, end = _day_bounds(day, user_timezone)
    cutoff = min(end, now_utc) if start <= now_utc < end else end

    relevant_tasks: list[Task] = []
    completed_tasks = 0

    for task in tasks:
        created_at = _as_utc(task.created_at)
        due_at = _as_utc(task.due_at)
        completed_at = _as_utc(task.completed_at)

        if created_at is None or created_at >= end:
            continue

        created_during_day = start <= created_at < end
        due_during_day = due_at is not None and start <= due_at < end
        completed_during_day = completed_at is not None and start <= completed_at < end

        if created_during_day or due_during_day or completed_during_day:
            relevant_tasks.append(task)
            if completed_at is not None and completed_at < end:
                completed_tasks += 1

    overdue_tasks = 0
    for task in tasks:
        created_at = _as_utc(task.created_at)
        due_at = _as_utc(task.due_at)
        completed_at = _as_utc(task.completed_at)

        if created_at is None or created_at >= cutoff or due_at is None:
            continue
        if due_at < cutoff and (completed_at is None or completed_at >= cutoff):
            overdue_tasks += 1

    due_habits = [habit for habit in habits if _is_habit_due(habit, day)]
    completed_habits = sum(
        1
        for habit in due_habits
        if completions.get((habit.id, day), 0) >= max(1, habit.target_count)
    )

    focus_seconds = sum(
        max(0, session.elapsed_seconds)
        for session in sessions
        if session.mode == "focus"
        and session.status == "completed"
        and _in_range(session.completed_at or session.started_at, start, end)
    )
    focus_minutes = focus_seconds // 60

    relevant_task_count = len(relevant_tasks)
    task_score = (
        _clamp((completed_tasks / relevant_task_count) * 100)
        if relevant_task_count
        else 0
    )
    habit_score = (
        _clamp((completed_habits / len(due_habits)) * 100)
        if due_habits
        else 0
    )
    focus_score = _clamp((focus_minutes / max(1, focus_goal)) * 100)
    overdue_penalty = min(20, overdue_tasks * 4)
    score = _clamp(
        task_score * 0.40
        + habit_score * 0.30
        + focus_score * 0.30
        - overdue_penalty
    )

    return {
        "score": score,
        "task_score": task_score,
        "habit_score": habit_score,
        "focus_score": focus_score,
        "completed_tasks": completed_tasks,
        "relevant_tasks": relevant_task_count,
        "completed_habits": completed_habits,
        "due_habits": len(due_habits),
        "focus_minutes": focus_minutes,
        "overdue_tasks": overdue_tasks,
        "overdue_penalty": overdue_penalty,
    }


def _trend_point(day: date, metrics: dict) -> dict:
    return {
        "date": day,
        "day": day.strftime("%a"),
        "score": metrics["score"],
        "tasks": metrics["completed_tasks"],
        "habits": metrics["completed_habits"],
        "focus_minutes": metrics["focus_minutes"],
        "overdue_penalty": metrics["overdue_penalty"],
    }


def get_productivity(db: Session, user: User) -> dict:
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    user_timezone = _user_timezone(profile.timezone if profile else None)
    focus_goal = max(
        1,
        profile.daily_focus_goal_minutes if profile else DEFAULT_FOCUS_GOAL_MINUTES,
    )

    now_utc = datetime.now(timezone.utc)
    today = now_utc.astimezone(user_timezone).date()
    history_start = today - timedelta(days=29)
    history_start_dt, _ = _day_bounds(history_start, user_timezone)
    _, tomorrow_dt = _day_bounds(today, user_timezone)

    tasks = list(db.scalars(select(Task).where(Task.user_id == user.id)).all())
    habits = list(
        db.scalars(
            select(Habit).where(
                Habit.user_id == user.id,
                Habit.is_archived.is_(False),
            )
        ).all()
    )
    habit_completions = list(
        db.scalars(
            select(HabitCompletion).where(
                HabitCompletion.user_id == user.id,
                HabitCompletion.completion_date >= history_start,
                HabitCompletion.completion_date <= today,
            )
        ).all()
    )
    sessions = list(
        db.scalars(
            select(FocusSession).where(
                FocusSession.user_id == user.id,
                FocusSession.started_at >= history_start_dt,
                FocusSession.started_at < tomorrow_dt,
            )
        ).all()
    )

    completion_map = {
        (completion.habit_id, completion.completion_date): completion.count
        for completion in habit_completions
    }

    trend = []
    active_days = 0
    daily_results: dict[date, dict] = {}

    for offset in range(30):
        day = history_start + timedelta(days=offset)
        metrics = _daily_metrics(
            day,
            tasks,
            habits,
            completion_map,
            sessions,
            focus_goal,
            user_timezone,
            now_utc,
        )
        daily_results[day] = metrics
        trend.append(_trend_point(day, metrics))

        if (
            metrics["completed_tasks"]
            or metrics["completed_habits"]
            or metrics["focus_minutes"]
        ):
            active_days += 1

    today_metrics = daily_results[today]
    previous_metrics = daily_results[today - timedelta(days=1)]
    score = today_metrics["score"]
    level = _level(score)

    components = [
        {
            "key": "tasks",
            "label": "Task completion",
            "score": today_metrics["task_score"],
            "weight": 40,
            "weighted_points": round(today_metrics["task_score"] * 0.40, 1),
            "current": today_metrics["completed_tasks"],
            "target": today_metrics["relevant_tasks"],
            "unit": "tasks",
            "explanation": "Tasks completed from those created, due, or completed today.",
            "action_label": "Open tasks",
            "action_href": "/tasks",
        },
        {
            "key": "habits",
            "label": "Habit consistency",
            "score": today_metrics["habit_score"],
            "weight": 30,
            "weighted_points": round(today_metrics["habit_score"] * 0.30, 1),
            "current": today_metrics["completed_habits"],
            "target": today_metrics["due_habits"],
            "unit": "habits",
            "explanation": "Scheduled habits completed against today’s habit targets.",
            "action_label": "Open habits",
            "action_href": "/habits",
        },
        {
            "key": "focus",
            "label": "Focus goal",
            "score": today_metrics["focus_score"],
            "weight": 30,
            "weighted_points": round(today_metrics["focus_score"] * 0.30, 1),
            "current": today_metrics["focus_minutes"],
            "target": focus_goal,
            "unit": "minutes",
            "explanation": "Completed deep-work minutes compared with your daily focus goal.",
            "action_label": "Start focus",
            "action_href": "/focus",
        },
    ]

    recommendations = []
    if today_metrics["overdue_tasks"]:
        recommendations.append(
            {
                "title": "Reduce overdue pressure",
                "message": f"{today_metrics['overdue_tasks']} overdue task{'s are' if today_metrics['overdue_tasks'] != 1 else ' is'} reducing today’s score by {today_metrics['overdue_penalty']} points.",
                "priority": "high",
                "action_label": "Review backlog",
                "action_href": "/tasks",
            }
        )
    if today_metrics["focus_score"] < 70:
        remaining = max(0, focus_goal - today_metrics["focus_minutes"])
        recommendations.append(
            {
                "title": "Add one focused block",
                "message": f"Complete another {remaining} focus minute{'s' if remaining != 1 else ''} to reach your daily goal.",
                "priority": "medium",
                "action_label": "Start focus session",
                "action_href": "/focus",
            }
        )
    if today_metrics["due_habits"] and today_metrics["habit_score"] < 100:
        remaining = today_metrics["due_habits"] - today_metrics["completed_habits"]
        recommendations.append(
            {
                "title": "Protect your habit consistency",
                "message": f"Complete {remaining} remaining habit{'s' if remaining != 1 else ''} to strengthen today’s consistency score.",
                "priority": "medium",
                "action_label": "Check habits",
                "action_href": "/habits",
            }
        )
    if today_metrics["relevant_tasks"] and today_metrics["task_score"] < 100:
        recommendations.append(
            {
                "title": "Finish a meaningful next action",
                "message": "Completing one relevant task can improve the strongest weighted part of your score.",
                "priority": "low",
                "action_label": "Choose a task",
                "action_href": "/tasks",
            }
        )
    if not recommendations:
        recommendations.append(
            {
                "title": "Maintain your balance",
                "message": "Your task, habit, and focus activity are currently balanced. Keep the next action small and intentional.",
                "priority": "positive",
                "action_label": "View dashboard",
                "action_href": "/dashboard",
            }
        )

    if active_days >= 20:
        confidence = "High"
    elif active_days >= 7:
        confidence = "Medium"
    else:
        confidence = "Early"

    summary = (
        f"Your score is {level.lower()} today. It combines task completion, "
        "habit consistency, focus progress, and an overdue-work penalty."
    )

    return {
        "generated_at": now_utc,
        "score": score,
        "previous_score": previous_metrics["score"],
        "score_change": score - previous_metrics["score"],
        "level": level,
        "summary": summary,
        "data_confidence": confidence,
        "active_days": active_days,
        "overdue_tasks": today_metrics["overdue_tasks"],
        "overdue_penalty": today_metrics["overdue_penalty"],
        "components": components,
        "trend": trend,
        "recommendations": recommendations[:4],
    }
