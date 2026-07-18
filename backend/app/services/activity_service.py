from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.distraction_log import DistractionLog
from app.models.energy_checkin import EnergyCheckIn
from app.models.focus_session import FocusSession
from app.models.habit import Habit, HabitCompletion
from app.models.movement_break import MovementBreak
from app.models.nourishment_log import NourishmentLog
from app.models.recovery_break import RecoveryBreak
from app.models.schedule_event import ScheduleEvent
from app.models.task import Task
from app.models.time_tracking import TimeEntry, TimeTrackingProject
from app.models.user import User


def _minutes(seconds: int | None) -> int:
    return max(0, round((seconds or 0) / 60))


def _title_case(value: str) -> str:
    return value.replace("_", " ").strip().title()


def get_activity_timeline(
    db: Session,
    current_user: User,
    *,
    days: int = 30,
    limit: int = 200,
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    user_id = current_user.id
    items: list[dict] = []

    completed_tasks = (
        db.query(Task)
        .filter(Task.user_id == user_id, Task.completed_at.isnot(None), Task.completed_at >= since)
        .order_by(Task.completed_at.desc())
        .limit(limit)
        .all()
    )
    for task in completed_tasks:
        items.append(
            {
                "id": f"task-{task.id}",
                "kind": "task",
                "title": f"Completed {task.title}",
                "description": "Task marked as completed",
                "occurred_at": task.completed_at,
                "metadata": {"priority": task.eisenhower, "energy_level": task.energy_level},
            }
        )

    habit_rows = (
        db.query(HabitCompletion, Habit)
        .join(Habit, Habit.id == HabitCompletion.habit_id)
        .filter(HabitCompletion.user_id == user_id, HabitCompletion.completed_at >= since)
        .order_by(HabitCompletion.completed_at.desc())
        .limit(limit)
        .all()
    )
    for completion, habit in habit_rows:
        items.append(
            {
                "id": f"habit-{completion.id}",
                "kind": "habit",
                "title": f"Completed {habit.name}",
                "description": f"{completion.count} {habit.unit}",
                "occurred_at": completion.completed_at,
                "metadata": {"category": habit.category, "count": completion.count},
            }
        )

    focus_sessions = (
        db.query(FocusSession)
        .filter(FocusSession.user_id == user_id, FocusSession.completed_at.isnot(None), FocusSession.completed_at >= since)
        .order_by(FocusSession.completed_at.desc())
        .limit(limit)
        .all()
    )
    for session in focus_sessions:
        minutes = _minutes(session.elapsed_seconds)
        items.append(
            {
                "id": f"focus-{session.id}",
                "kind": "focus",
                "title": session.title or "Focus session",
                "description": f"Completed a {minutes}-minute {session.mode} session",
                "occurred_at": session.completed_at,
                "duration_minutes": minutes,
                "metadata": {"mode": session.mode, "status": session.status},
            }
        )

    time_rows = (
        db.query(TimeEntry, TimeTrackingProject)
        .outerjoin(TimeTrackingProject, TimeTrackingProject.id == TimeEntry.project_id)
        .filter(TimeEntry.user_id == user_id, TimeEntry.ended_at.isnot(None), TimeEntry.ended_at >= since)
        .order_by(TimeEntry.ended_at.desc())
        .limit(limit)
        .all()
    )
    for entry, project in time_rows:
        minutes = _minutes(entry.duration_seconds)
        items.append(
            {
                "id": f"time-{entry.id}",
                "kind": "time_tracking",
                "title": entry.description,
                "description": f"Tracked {minutes} minutes{f' for {project.name}' if project else ''}",
                "occurred_at": entry.ended_at,
                "duration_minutes": minutes,
                "metadata": {"project": project.name if project else None, "source": entry.source},
            }
        )

    schedule_events = (
        db.query(ScheduleEvent)
        .filter(ScheduleEvent.user_id == user_id, ScheduleEvent.created_at >= since)
        .order_by(ScheduleEvent.created_at.desc())
        .limit(limit)
        .all()
    )
    for event in schedule_events:
        items.append(
            {
                "id": f"schedule-{event.id}",
                "kind": "schedule",
                "title": f"Scheduled {event.title}",
                "description": f"Starts {event.start_at.strftime('%b %d at %H:%M')}",
                "occurred_at": event.created_at,
                "metadata": {"event_type": event.event_type, "all_day": event.is_all_day},
            }
        )

    energy_entries = (
        db.query(EnergyCheckIn)
        .filter(EnergyCheckIn.user_id == user_id, EnergyCheckIn.checked_at >= since)
        .order_by(EnergyCheckIn.checked_at.desc())
        .limit(limit)
        .all()
    )
    for entry in energy_entries:
        items.append(
            {
                "id": f"energy-{entry.id}",
                "kind": "energy",
                "title": "Energy check-in",
                "description": f"Energy {entry.energy_level}/5 · Focus {entry.focus_level}/5 · Stress {entry.stress_level}/5",
                "occurred_at": entry.checked_at,
                "metadata": {
                    "energy": entry.energy_level,
                    "focus": entry.focus_level,
                    "stress": entry.stress_level,
                },
            }
        )

    movement_entries = (
        db.query(MovementBreak)
        .filter(MovementBreak.user_id == user_id, MovementBreak.completed_at >= since)
        .order_by(MovementBreak.completed_at.desc())
        .limit(limit)
        .all()
    )
    for entry in movement_entries:
        minutes = _minutes(entry.duration_seconds)
        items.append(
            {
                "id": f"movement-{entry.id}",
                "kind": "movement",
                "title": f"{_title_case(entry.routine)} movement break",
                "description": f"Completed {minutes} minutes of movement",
                "occurred_at": entry.completed_at,
                "duration_minutes": minutes,
                "metadata": {"routine": entry.routine, "status": entry.status},
            }
        )

    nourishment_entries = (
        db.query(NourishmentLog)
        .filter(NourishmentLog.user_id == user_id, NourishmentLog.logged_at >= since)
        .order_by(NourishmentLog.logged_at.desc())
        .limit(limit)
        .all()
    )
    for entry in nourishment_entries:
        if entry.kind == "water":
            title = "Logged water"
            description = f"{entry.amount_ml or 0} ml hydration entry"
        else:
            title = f"Logged {_title_case(entry.meal_type or 'meal')}"
            description = entry.note or "Meal awareness entry"
        items.append(
            {
                "id": f"nourishment-{entry.id}",
                "kind": "nourishment",
                "title": title,
                "description": description,
                "occurred_at": entry.logged_at,
                "metadata": {"kind": entry.kind, "amount_ml": entry.amount_ml, "meal_type": entry.meal_type},
            }
        )

    recovery_entries = (
        db.query(RecoveryBreak)
        .filter(RecoveryBreak.user_id == user_id, RecoveryBreak.completed_at >= since)
        .order_by(RecoveryBreak.completed_at.desc())
        .limit(limit)
        .all()
    )
    for entry in recovery_entries:
        items.append(
            {
                "id": f"recovery-{entry.id}",
                "kind": "recovery",
                "title": f"{_title_case(entry.break_type)} recovery break",
                "description": f"Completed {entry.duration_minutes} minutes · Felt {entry.feedback}",
                "occurred_at": entry.completed_at,
                "duration_minutes": entry.duration_minutes,
                "metadata": {"break_type": entry.break_type, "feedback": entry.feedback},
            }
        )

    distraction_entries = (
        db.query(DistractionLog)
        .filter(DistractionLog.user_id == user_id, DistractionLog.occurred_at >= since)
        .order_by(DistractionLog.occurred_at.desc())
        .limit(limit)
        .all()
    )
    for entry in distraction_entries:
        items.append(
            {
                "id": f"distraction-{entry.id}",
                "kind": "distraction",
                "title": f"{_title_case(entry.distraction_type)} distraction",
                "description": f"{entry.minutes_lost} minutes lost in {_title_case(entry.context)}",
                "occurred_at": entry.occurred_at,
                "duration_minutes": entry.minutes_lost,
                "metadata": {"context": entry.context, "intensity": entry.intensity},
            }
        )

    items.sort(key=lambda item: item["occurred_at"], reverse=True)
    items = items[:limit]
    kinds = list(dict.fromkeys(item["kind"] for item in items))
    active_days = len({item["occurred_at"].date() for item in items})

    return {
        "items": items,
        "summary": {
            "total_events": len(items),
            "active_days": active_days,
            "tasks_completed": sum(1 for item in items if item["kind"] == "task"),
            "focus_minutes": sum(item.get("duration_minutes") or 0 for item in items if item["kind"] == "focus"),
            "tracked_minutes": sum(item.get("duration_minutes") or 0 for item in items if item["kind"] == "time_tracking"),
        },
        "available_kinds": kinds,
    }
