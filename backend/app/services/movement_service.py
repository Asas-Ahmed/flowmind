from datetime import date, datetime, time, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.movement_break import MovementBreak
from app.models.user import User
from app.repositories.focus_repo import list_sessions
from app.repositories.movement_repo import (
    get_movement_break,
    latest_completed_break,
    list_movement_breaks,
)
from app.schemas.movement_schema import MovementBreakCreate

BREAK_AFTER_FOCUS_SESSIONS = 2


def _utc_day_bounds(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time.min, tzinfo=timezone.utc)
    return start, start + timedelta(days=1)


def _completed_focus_sessions_since(
    db: Session, user_id: int, date_from: datetime | None
) -> int:
    sessions = list_sessions(db, user_id, date_from=date_from)
    return sum(
        1
        for session in sessions
        if session.status == "completed"
        and session.mode == "focus"
        and session.elapsed_seconds >= 60
    )


def _movement_streaks(records: list[MovementBreak], today: date) -> tuple[int, int]:
    active_dates = {
        record.completed_at.date()
        for record in records
        if record.status == "completed"
    }
    if not active_dates:
        return 0, 0

    ordered = sorted(active_dates)
    best = 1
    running = 1
    for previous, current in zip(ordered, ordered[1:]):
        if current == previous + timedelta(days=1):
            running += 1
            best = max(best, running)
        else:
            running = 1

    current = 0
    cursor = today if today in active_dates else today - timedelta(days=1)
    while cursor in active_dates:
        current += 1
        cursor -= timedelta(days=1)
    return current, best


def get_movement_workspace(db: Session, user: User) -> dict:
    now = datetime.now(timezone.utc)
    today = now.date()
    week_start = today - timedelta(days=6)
    date_from, _ = _utc_day_bounds(week_start)
    _, date_to = _utc_day_bounds(today)

    latest_break = latest_completed_break(db, user.id)
    focus_since_break = _completed_focus_sessions_since(
        db, user.id, latest_break.completed_at if latest_break else None
    )

    weekly_records = list_movement_breaks(
        db, user.id, date_from=date_from, date_to=date_to
    )
    recent_records = list_movement_breaks(db, user.id, limit=10)
    all_records = list_movement_breaks(db, user.id)

    completed_weekly = [item for item in weekly_records if item.status == "completed"]
    finished_weekly = [
        item for item in weekly_records if item.status in {"completed", "skipped"}
    ]
    today_completed = [
        item for item in completed_weekly if item.completed_at.date() == today
    ]

    daily_points = []
    for offset in range(7):
        target = week_start + timedelta(days=offset)
        matching = [
            item for item in completed_weekly if item.completed_at.date() == target
        ]
        daily_points.append(
            {
                "date": target,
                "completed": len(matching),
                "minutes": round(sum(item.duration_seconds for item in matching) / 60),
            }
        )

    current_streak, best_streak = _movement_streaks(all_records, today)
    sessions_until_break = max(0, BREAK_AFTER_FOCUS_SESSIONS - focus_since_break)

    return {
        "break_due": focus_since_break >= BREAK_AFTER_FOCUS_SESSIONS,
        "focus_sessions_since_break": focus_since_break,
        "sessions_until_break": sessions_until_break,
        "today_completed": len(today_completed),
        "today_minutes": round(sum(item.duration_seconds for item in today_completed) / 60),
        "weekly_completed": len(completed_weekly),
        "current_streak": current_streak,
        "best_streak": best_streak,
        "completion_rate": round(
            len(completed_weekly) / len(finished_weekly) * 100
            if finished_weekly
            else 0,
            1,
        ),
        "recent_breaks": recent_records,
        "daily_points": daily_points,
    }


def record_movement_break(
    db: Session, user: User, data: MovementBreakCreate
) -> MovementBreak:
    latest_break = latest_completed_break(db, user.id)
    trigger_count = _completed_focus_sessions_since(
        db, user.id, latest_break.completed_at if latest_break else None
    )
    record = MovementBreak(
        user_id=user.id,
        routine=data.routine,
        status=data.status,
        duration_seconds=data.duration_seconds if data.status == "completed" else 0,
        trigger_focus_sessions=trigger_count,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def delete_movement_break(
    db: Session, user: User, break_id: int
) -> None:
    record = get_movement_break(db, user.id, break_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movement break log not found",
        )
    db.delete(record)
    db.commit()
