from datetime import date, datetime, time, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.focus_session import FocusSession
from app.models.habit import Habit
from app.models.schedule_event import ScheduleEvent
from app.models.task import Task
from app.models.user import User
from app.repositories.schedule_repo import get_event, list_events
from app.repositories.task_repo import get_task
from app.schemas.schedule_schema import ScheduleEventCreate, ScheduleEventUpdate


def _day_start(value: date) -> datetime:
    return datetime.combine(value, time.min, tzinfo=timezone.utc)


def _habit_occurs(habit: Habit, target: date) -> bool:
    if habit.is_archived or target < habit.start_date:
        return False
    if habit.end_date and target > habit.end_date:
        return False

    weekday = target.weekday()
    if habit.frequency == "daily":
        return True
    if habit.frequency == "weekdays":
        return weekday < 5
    if habit.frequency in {"weekly", "custom"}:
        return weekday in (habit.scheduled_days or [])
    return False


def _habit_datetime(target: date, reminder_time: str | None) -> datetime:
    hour, minute = (9, 0)
    if reminder_time:
        try:
            hour, minute = [int(part) for part in reminder_time.split(":", 1)]
        except (TypeError, ValueError):
            pass
    return datetime.combine(target, time(hour=hour, minute=minute), tzinfo=timezone.utc)


def _serialize_event(event: ScheduleEvent) -> dict:
    reminder_at = None
    if event.reminder_enabled:
        reminder_at = event.start_at - timedelta(minutes=event.reminder_minutes_before)
    return {
        "id": f"event-{event.id}",
        "source": "event",
        "source_id": event.id,
        "title": event.title,
        "description": event.description,
        "start_at": event.start_at,
        "end_at": event.end_at,
        "is_all_day": event.is_all_day,
        "color": event.color,
        "status": event.event_type,
        "reminder_at": reminder_at,
        "location": event.location,
    }


def get_workspace(db: Session, user: User, range_start: date, range_end: date) -> dict:
    if range_end < range_start:
        raise HTTPException(status_code=400, detail="Invalid schedule date range.")
    if (range_end - range_start).days > 62:
        raise HTTPException(status_code=400, detail="Schedule range cannot exceed 63 days.")

    start_dt = _day_start(range_start)
    end_dt = _day_start(range_end + timedelta(days=1))
    now = datetime.now(timezone.utc)

    events = list_events(db, user.id, range_start=start_dt, range_end=end_dt)
    tasks = list(
        db.scalars(
            select(Task)
            .where(
                Task.user_id == user.id,
                Task.due_at.is_not(None),
                Task.due_at >= start_dt,
                Task.due_at < end_dt,
            )
            .order_by(Task.due_at.asc())
        ).all()
    )
    overdue_tasks = list(
        db.scalars(
            select(Task).where(
                Task.user_id == user.id,
                Task.due_at.is_not(None),
                Task.due_at < now,
                Task.status != "completed",
            )
        ).all()
    )
    habits = list(
        db.scalars(
            select(Habit).where(Habit.user_id == user.id, Habit.is_archived.is_(False))
        ).all()
    )
    focus_sessions = list(
        db.scalars(
            select(FocusSession)
            .where(
                FocusSession.user_id == user.id,
                FocusSession.started_at >= start_dt,
                FocusSession.started_at < end_dt,
            )
            .order_by(FocusSession.started_at.asc())
        ).all()
    )

    items: list[dict] = [_serialize_event(event) for event in events]

    for task in tasks:
        items.append(
            {
                "id": f"task-{task.id}",
                "source": "task",
                "source_id": task.id,
                "title": task.title,
                "description": task.description,
                "start_at": task.start_at or task.due_at,
                "end_at": task.due_at,
                "is_all_day": task.is_all_day,
                "color": "#4a6ded",
                "status": task.status,
                "reminder_at": task.reminder_at if task.reminder_enabled else None,
                "location": None,
            }
        )

    cursor = range_start
    while cursor <= range_end:
        for habit in habits:
            if not _habit_occurs(habit, cursor):
                continue
            start_at = _habit_datetime(cursor, habit.reminder_time)
            items.append(
                {
                    "id": f"habit-{habit.id}-{cursor.isoformat()}",
                    "source": "habit",
                    "source_id": habit.id,
                    "title": habit.name,
                    "description": habit.description,
                    "start_at": start_at,
                    "end_at": start_at + timedelta(minutes=15),
                    "is_all_day": False,
                    "color": habit.color,
                    "status": "habit",
                    "reminder_at": start_at if habit.reminder_enabled else None,
                    "location": None,
                }
            )
        cursor += timedelta(days=1)

    for session in focus_sessions:
        items.append(
            {
                "id": f"focus-{session.id}",
                "source": "focus",
                "source_id": session.id,
                "title": session.title,
                "description": session.note,
                "start_at": session.started_at,
                "end_at": session.completed_at
                or session.started_at + timedelta(minutes=session.planned_minutes),
                "is_all_day": False,
                "color": "#762bbc",
                "status": session.status,
                "reminder_at": None,
                "location": None,
            }
        )

    items.sort(key=lambda item: item["start_at"])
    today = now.date()
    summaries = []
    cursor = range_start
    while cursor <= range_end:
        matching = [item for item in items if item["start_at"].date() == cursor]
        summaries.append(
            {
                "date": cursor,
                "total": len(matching),
                "tasks": sum(item["source"] == "task" for item in matching),
                "events": sum(item["source"] == "event" for item in matching),
                "habits": sum(item["source"] == "habit" for item in matching),
                "focus": sum(item["source"] == "focus" for item in matching),
            }
        )
        cursor += timedelta(days=1)

    return {
        "range_start": range_start,
        "range_end": range_end,
        "items": items,
        "events": events,
        "day_summaries": summaries,
        "upcoming_count": sum(item["start_at"] >= now for item in items),
        "today_count": sum(item["start_at"].date() == today for item in items),
        "overdue_count": len(overdue_tasks),
        "reminder_count": sum(
            item["reminder_at"] is not None and item["start_at"] >= now for item in items
        ),
    }


def create_event(db: Session, user: User, data: ScheduleEventCreate) -> ScheduleEvent:
    if data.task_id and not get_task(db, user.id, data.task_id):
        raise HTTPException(status_code=404, detail="Task not found.")
    event = ScheduleEvent(user_id=user.id, **data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def update_event(
    db: Session, user: User, event_id: int, data: ScheduleEventUpdate
) -> ScheduleEvent:
    event = get_event(db, user.id, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Schedule event not found.")

    values = data.model_dump(exclude_unset=True)
    task_id = values.get("task_id")
    if task_id and not get_task(db, user.id, task_id):
        raise HTTPException(status_code=404, detail="Task not found.")

    start_at = values.get("start_at", event.start_at)
    end_at = values.get("end_at", event.end_at)
    if end_at <= start_at:
        raise HTTPException(status_code=400, detail="End time must be after the start time.")

    for key, value in values.items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, user: User, event_id: int) -> None:
    event = get_event(db, user.id, event_id)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule event not found.")
    db.delete(event)
    db.commit()
