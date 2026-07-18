from collections import Counter
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.distraction_log import DistractionLog
from app.models.user import User
from app.repositories.distraction_repo import (
    get_distraction_log,
    list_distraction_logs,
    list_distractions_since,
)
from app.schemas.distraction_schema import DistractionCreate


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def create_distraction_log(
    db: Session, user: User, data: DistractionCreate
) -> DistractionLog:
    occurred_at = data.occurred_at or datetime.now(timezone.utc)
    if occurred_at.tzinfo is None:
        occurred_at = occurred_at.replace(tzinfo=timezone.utc)

    log = DistractionLog(
        user_id=user.id,
        distraction_type=data.distraction_type,
        context=data.context,
        intensity=data.intensity,
        minutes_lost=data.minutes_lost,
        recovery_action=_clean(data.recovery_action),
        note=_clean(data.note),
        occurred_at=occurred_at,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def delete_distraction_log(db: Session, user: User, log_id: int) -> None:
    log = get_distraction_log(db, user.id, log_id)
    if log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Distraction log not found",
        )
    db.delete(log)
    db.commit()


def get_distraction_workspace(db: Session, user: User) -> dict:
    logs = list_distraction_logs(db, user.id)
    week_start = datetime.now(timezone.utc) - timedelta(days=7)
    weekly_logs = list_distractions_since(db, user.id, week_start)

    counts = Counter(log.distraction_type for log in logs)
    total_logs = len(logs)
    most_common = counts.most_common(1)[0][0] if counts else None
    breakdown = [
        {
            "distraction_type": distraction_type,
            "count": count,
            "percentage": round((count / total_logs) * 100, 1) if total_logs else 0.0,
        }
        for distraction_type, count in counts.most_common()
    ]

    hour_counts = Counter(log.occurred_at.hour for log in logs)
    peak_hour = hour_counts.most_common(1)[0][0] if hour_counts else None
    minutes_lost = sum(log.minutes_lost for log in weekly_logs)

    if not logs:
        insight = {
            "title": "Notice the interruption, not just the outcome",
            "message": "Log distractions as they happen to reveal the situations that repeatedly break your attention.",
            "experiment": "During your next focus block, record the first interruption with one tap.",
            "tone": "neutral",
        }
    elif most_common in {"phone", "social_media", "messages"}:
        insight = {
            "title": "Digital interruptions lead your pattern",
            "message": f"{most_common.replace('_', ' ').title()} is your most frequent logged distraction.",
            "experiment": "Try one focus session with notifications muted and the phone placed out of reach.",
            "tone": "attention",
        }
    elif most_common == "tiredness":
        insight = {
            "title": "Fatigue is interrupting focus",
            "message": "Tiredness appears more often than other distractions in your history.",
            "experiment": "Test a shorter focus block after a water or movement break and compare the result.",
            "tone": "attention",
        }
    elif len(weekly_logs) <= 2 and total_logs >= 4:
        insight = {
            "title": "Interruptions are trending down",
            "message": "You logged relatively few distractions during the last seven days.",
            "experiment": "Keep the environment change that helped and observe whether the pattern continues.",
            "tone": "positive",
        }
    else:
        insight = {
            "title": "Your distraction pattern is becoming clearer",
            "message": f"You logged {len(weekly_logs)} interruptions in the last seven days.",
            "experiment": "Choose the most common trigger and change only one environmental factor this week.",
            "tone": "neutral",
        }

    return {
        "total_logs": total_logs,
        "logs_this_week": len(weekly_logs),
        "minutes_lost_this_week": minutes_lost,
        "most_common_distraction": most_common,
        "peak_hour": peak_hour,
        "breakdown": breakdown,
        "insight": insight,
        "logs": logs,
    }
