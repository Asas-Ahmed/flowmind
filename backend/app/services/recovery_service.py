from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.recovery_break import RecoveryBreak
from app.models.user import User
from app.repositories.recovery_repo import get_break, list_breaks
from app.schemas.recovery_schema import RecoveryBreakCreate

BREAK_TYPES = ("breathing", "stretching", "eye_care", "water", "quiet_rest", "short_walk")


def _day_start(day: date) -> datetime:
    return datetime.combine(day, time.min, tzinfo=timezone.utc)


def _streak(records: list[RecoveryBreak], today: date) -> int:
    active_days = {record.completed_at.date() for record in records}
    cursor = today
    count = 0
    while cursor in active_days:
        count += 1
        cursor -= timedelta(days=1)
    return count


def _recommended_type(records: list[RecoveryBreak]) -> str:
    stats: dict[str, dict[str, int]] = defaultdict(lambda: {"sessions": 0, "helpful": 0})
    for record in records:
        stats[record.break_type]["sessions"] += 1
        if record.feedback == "better":
            stats[record.break_type]["helpful"] += 1
    experienced = [kind for kind in BREAK_TYPES if stats[kind]["sessions"] > 0]
    if not experienced:
        return "breathing"
    return max(experienced, key=lambda kind: (stats[kind]["helpful"] / stats[kind]["sessions"], stats[kind]["sessions"]))


def get_recovery_workspace(db: Session, user: User) -> dict:
    now = datetime.now(timezone.utc)
    today = now.date()
    week_start = today - timedelta(days=6)
    weekly = list_breaks(db, user.id, date_from=_day_start(week_start))
    recent = list_breaks(db, user.id, limit=12)
    today_records = [record for record in weekly if record.completed_at.date() == today]
    helpful = sum(1 for record in weekly if record.feedback == "better")
    helpful_rate = round(helpful / len(weekly) * 100, 1) if weekly else 0.0
    recommended = _recommended_type(weekly)

    daily_points = []
    for offset in range(7):
        target = week_start + timedelta(days=offset)
        matches = [record for record in weekly if record.completed_at.date() == target]
        daily_points.append({
            "date": target,
            "breaks": len(matches),
            "helpful_breaks": sum(1 for record in matches if record.feedback == "better"),
            "minutes": sum(record.duration_minutes for record in matches),
        })

    type_stats = []
    for kind in BREAK_TYPES:
        matches = [record for record in weekly if record.break_type == kind]
        rate = round(sum(1 for record in matches if record.feedback == "better") / len(matches) * 100, 1) if matches else 0.0
        type_stats.append({"break_type": kind, "sessions": len(matches), "helpful_rate": rate})

    if not weekly:
        title = "Start with a short reset"
        message = "Try a two-minute breathing or eye-care break, then record how you feel so FlowMind can learn what helps you recover."
    elif helpful_rate >= 70:
        title = "Your recovery breaks are helping"
        message = f"{recommended.replace('_', ' ').title()} has been one of your strongest recent recovery choices."
    elif len(today_records) == 0:
        title = "A deliberate pause may help"
        message = "You have not recorded a recovery break today. Choose a short option that fits your current situation."
    else:
        title = "Keep recovery flexible"
        message = "Your feedback is mixed, so vary the break type and duration rather than forcing one routine."

    return {
        "today_breaks": len(today_records),
        "today_minutes": sum(record.duration_minutes for record in today_records),
        "weekly_breaks": len(weekly),
        "weekly_minutes": sum(record.duration_minutes for record in weekly),
        "helpful_rate": helpful_rate,
        "current_streak": _streak(weekly, today),
        "recommended_type": recommended,
        "assistant_title": title,
        "assistant_message": message,
        "recent_breaks": recent,
        "daily_points": daily_points,
        "type_stats": type_stats,
    }


def create_recovery_break(db: Session, user: User, data: RecoveryBreakCreate) -> RecoveryBreak:
    record = RecoveryBreak(
        user_id=user.id,
        break_type=data.break_type,
        duration_minutes=data.duration_minutes,
        feedback=data.feedback,
        note=data.note.strip() if data.note else None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def delete_recovery_break(db: Session, user: User, break_id: int) -> None:
    record = get_break(db, user.id, break_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recovery break not found")
    db.delete(record)
    db.commit()
