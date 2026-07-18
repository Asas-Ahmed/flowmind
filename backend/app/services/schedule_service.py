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
    linked_task_ids = {event.task_id for event in events if event.task_id is not None}

    for task in tasks:
        if task.id in linked_task_ids:
            continue
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


def _priority_score(task: Task, now: datetime) -> int:
    eisenhower_scores = {
        "urgent_important": 60,
        "important_not_urgent": 40,
        "urgent_not_important": 30,
        "not_urgent_not_important": 10,
    }
    score = eisenhower_scores.get(task.eisenhower, 20)
    if task.status == "in_progress":
        score += 12
    if task.due_at:
        hours = (task.due_at - now).total_seconds() / 3600
        if hours < 0:
            score += 45
        elif hours <= 24:
            score += 35
        elif hours <= 72:
            score += 24
        elif hours <= 168:
            score += 12
    return score


def _task_duration(task: Task, slot_minutes: int) -> int:
    base = {"low": 30, "medium": 60, "high": 90}.get(task.energy_level, 60)
    if task.eisenhower == "urgent_important":
        base += 30
    elif task.eisenhower == "not_urgent_not_important":
        base = max(30, base - 30)
    return max(slot_minutes, round(base / slot_minutes) * slot_minutes)


def _overlaps(start_at: datetime, end_at: datetime, busy: list[tuple[datetime, datetime]]) -> bool:
    return any(start_at < busy_end and end_at > busy_start for busy_start, busy_end in busy)


def _local_day_window(target: date, start_hour: int, end_hour: int, offset_minutes: int) -> tuple[datetime, datetime]:
    offset = timedelta(minutes=offset_minutes)
    local_start = datetime.combine(target, time(hour=start_hour), tzinfo=timezone.utc)
    local_end = datetime.combine(target, time(hour=end_hour), tzinfo=timezone.utc)
    return local_start + offset, local_end + offset


def generate_smart_schedule(db: Session, user: User, data) -> dict:
    from app.schemas.schedule_schema import SmartScheduleRequest

    assert isinstance(data, SmartScheduleRequest)
    now = datetime.now(timezone.utc)
    start_dt = _day_start(data.range_start)
    end_dt = _day_start(data.range_end + timedelta(days=1))

    existing_events = list_events(db, user.id, range_start=start_dt, range_end=end_dt)
    linked_task_ids = {event.task_id for event in existing_events if event.task_id is not None}
    tasks = list(
        db.scalars(
            select(Task).where(
                Task.user_id == user.id,
                Task.status != "completed",
            )
        ).all()
    )
    candidates = [
        task for task in tasks
        if task.id not in linked_task_ids and task.start_at is None
    ]
    candidates.sort(key=lambda task: (-_priority_score(task, now), task.due_at or end_dt))

    busy: list[tuple[datetime, datetime]] = [(event.start_at, event.end_at) for event in existing_events]
    for task in tasks:
        if task.start_at and task.due_at and task.due_at > task.start_at:
            busy.append((task.start_at, task.due_at))

    focus_sessions = list(
        db.scalars(
            select(FocusSession).where(
                FocusSession.user_id == user.id,
                FocusSession.started_at >= start_dt,
                FocusSession.started_at < end_dt,
            )
        ).all()
    )
    for session in focus_sessions:
        busy.append(
            (
                session.started_at,
                session.completed_at
                or session.started_at + timedelta(minutes=session.planned_minutes),
            )
        )

    habits = list(
        db.scalars(
            select(Habit).where(Habit.user_id == user.id, Habit.is_archived.is_(False))
        ).all()
    )
    cursor_day = data.range_start
    while cursor_day <= data.range_end:
        for habit in habits:
            if _habit_occurs(habit, cursor_day):
                habit_start = _habit_datetime(cursor_day, habit.reminder_time)
                busy.append((habit_start, habit_start + timedelta(minutes=15)))
        cursor_day += timedelta(days=1)

    busy.sort(key=lambda item: item[0])
    suggestions: list[dict] = []

    for task in candidates:
        if len(suggestions) >= data.max_items:
            break
        duration = _task_duration(task, data.slot_minutes)
        placed = False
        cursor_day = data.range_start
        while cursor_day <= data.range_end and not placed:
            if not data.include_weekends and cursor_day.weekday() >= 5:
                cursor_day += timedelta(days=1)
                continue
            window_start, window_end = _local_day_window(
                cursor_day,
                data.workday_start_hour,
                data.workday_end_hour,
                data.timezone_offset_minutes,
            )
            cursor = max(window_start, now + timedelta(minutes=15))
            cursor = cursor.replace(second=0, microsecond=0)
            remainder = cursor.minute % data.slot_minutes
            if remainder:
                cursor += timedelta(minutes=data.slot_minutes - remainder)

            while cursor + timedelta(minutes=duration) <= window_end:
                candidate_end = cursor + timedelta(minutes=duration)
                if task.due_at and cursor > task.due_at:
                    break
                if not _overlaps(cursor, candidate_end, busy):
                    score = _priority_score(task, now)
                    due_text = "No deadline set"
                    warning = None
                    if task.due_at:
                        hours = (task.due_at - now).total_seconds() / 3600
                        if hours < 0:
                            due_text = "Deadline has passed"
                            warning = "This task is overdue, so the earliest available slot was selected."
                        elif hours <= 24:
                            due_text = "Due within 24 hours"
                        elif hours <= 72:
                            due_text = "Due within 3 days"
                        else:
                            due_text = f"Due {task.due_at.strftime('%b %d')}"
                    priority_label = task.eisenhower.replace("_", " ").title()
                    suggestions.append(
                        {
                            "task_id": task.id,
                            "task_title": task.title,
                            "start_at": cursor,
                            "end_at": candidate_end,
                            "duration_minutes": duration,
                            "score": score,
                            "priority_label": priority_label,
                            "energy_level": task.energy_level,
                            "due_at": task.due_at,
                            "reason": f"{priority_label}; {due_text}; matched to a {task.energy_level}-energy {duration}-minute block.",
                            "warning": warning,
                        }
                    )
                    busy.append((cursor, candidate_end + timedelta(minutes=data.break_minutes)))
                    busy.sort(key=lambda item: item[0])
                    placed = True
                    break
                cursor += timedelta(minutes=data.slot_minutes)
            cursor_day += timedelta(days=1)

    scheduled_minutes = sum(item["duration_minutes"] for item in suggestions)
    remaining = max(0, len(candidates) - len(suggestions))
    if not candidates:
        explanation = "All unfinished tasks are already scheduled or there are no open tasks."
    elif suggestions:
        explanation = "Suggestions are ranked by deadline pressure, Eisenhower priority, task status, energy demand, and conflict-free availability."
    else:
        explanation = "No conflict-free slots were found inside the selected work hours. Expand the date range or workday window."

    return {
        "suggestions": suggestions,
        "unscheduled_task_count": len(candidates),
        "scheduled_minutes": scheduled_minutes,
        "remaining_task_count": remaining,
        "explanation": explanation,
    }


def apply_smart_schedule(db: Session, user: User, data) -> dict:
    from app.schemas.schedule_schema import SmartScheduleApplyRequest

    assert isinstance(data, SmartScheduleApplyRequest)
    created: list[ScheduleEvent] = []
    skipped = 0
    for suggestion in data.suggestions:
        task = get_task(db, user.id, suggestion.task_id)
        if not task or task.status == "completed":
            skipped += 1
            continue
        existing = db.scalar(
            select(ScheduleEvent).where(
                ScheduleEvent.user_id == user.id,
                ScheduleEvent.task_id == task.id,
            )
        )
        conflict = db.scalar(
            select(ScheduleEvent).where(
                ScheduleEvent.user_id == user.id,
                ScheduleEvent.start_at < suggestion.end_at,
                ScheduleEvent.end_at > suggestion.start_at,
            )
        )
        if existing or conflict:
            skipped += 1
            continue
        event = ScheduleEvent(
            user_id=user.id,
            task_id=task.id,
            title=task.title,
            description=f"Smart-scheduled task. {suggestion.reason}",
            event_type="focus",
            color="#4a6ded",
            start_at=suggestion.start_at,
            end_at=suggestion.end_at,
            is_all_day=False,
            reminder_enabled=True,
            reminder_minutes_before=15,
        )
        db.add(event)
        created.append(event)
    db.commit()
    for event in created:
        db.refresh(event)
    return {"created_events": created, "created_count": len(created), "skipped_count": skipped}
