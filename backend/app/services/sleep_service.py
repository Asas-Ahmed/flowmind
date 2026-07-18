from datetime import date, datetime, time, timedelta
from math import sqrt

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.sleep_record import SleepRecord
from app.models.user import User
from app.repositories.sleep_repo import (
    get_sleep_record,
    get_sleep_record_for_date,
    list_sleep_records,
)
from app.schemas.sleep_schema import SleepRecordCreate


def _minutes(value: time) -> int:
    return value.hour * 60 + value.minute


def _bedtime_axis(value: time) -> int:
    minutes = _minutes(value)
    return minutes + 1440 if minutes < 720 else minutes


def _duration_hours(bedtime: time, wake_time: time) -> float:
    start = _minutes(bedtime)
    end = _minutes(wake_time)
    duration = end - start
    if duration <= 0:
        duration += 1440
    if duration < 120 or duration > 960:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Sleep duration must be between 2 and 16 hours",
        )
    return round(duration / 60, 2)


def _variation(values: list[int]) -> int:
    if len(values) < 2:
        return 0
    average = sum(values) / len(values)
    variance = sum((value - average) ** 2 for value in values) / len(values)
    return round(sqrt(variance))


def _insight(
    records: list[SleepRecord],
    average_duration: float,
    bedtime_variation: int,
    wake_variation: int,
) -> dict[str, str]:
    if not records:
        return {
            "key": "start_tracking",
            "title": "Build your sleep baseline",
            "message": "Add a few sleep records so FlowMind can identify consistency patterns.",
            "action": "Record last night's bedtime, wake time, and sleep quality.",
            "tone": "neutral",
        }
    if len(records) < 3:
        return {
            "key": "more_data_needed",
            "title": "Your baseline is forming",
            "message": "A few more records will make regularity insights more meaningful.",
            "action": "Continue logging sleep for the rest of this week.",
            "tone": "neutral",
        }
    if bedtime_variation > 90 or wake_variation > 90:
        return {
            "key": "irregular_schedule",
            "title": "Your sleep timing is changing often",
            "message": "Large bedtime or wake-time shifts can make your weekly routine less predictable.",
            "action": "Aim for a bedtime and wake time within the same 60-minute window tonight.",
            "tone": "attention",
        }
    if average_duration < 6:
        return {
            "key": "short_duration",
            "title": "Your recorded sleep duration is low",
            "message": "Recent records show a shorter sleep window alongside your regularity pattern.",
            "action": "Protect a longer sleep window before scheduling demanding work tomorrow.",
            "tone": "attention",
        }
    if bedtime_variation <= 45 and wake_variation <= 45:
        return {
            "key": "consistent_schedule",
            "title": "Your sleep timing is consistent",
            "message": "Your recent bedtime and wake-time pattern has stayed within a steady range.",
            "action": "Keep this routine and compare it with your focus and productivity trends.",
            "tone": "positive",
        }
    return {
        "key": "moderate_consistency",
        "title": "Your routine is reasonably steady",
        "message": "Your sleep timing has some variation, but the overall pattern remains manageable.",
        "action": "Choose one anchor time—bedtime or wake time—and keep it steady this week.",
        "tone": "steady",
    }


def create_sleep_record(db: Session, user: User, data: SleepRecordCreate) -> SleepRecord:
    if data.sleep_date > date.today():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Sleep date cannot be in the future",
        )
    if get_sleep_record_for_date(db, user.id, data.sleep_date):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A sleep record already exists for this date",
        )

    record = SleepRecord(
        user_id=user.id,
        sleep_date=data.sleep_date,
        bedtime=data.bedtime,
        wake_time=data.wake_time,
        duration_hours=_duration_hours(data.bedtime, data.wake_time),
        quality=data.quality,
        note=data.note.strip() if data.note and data.note.strip() else None,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_sleep_workspace(db: Session, user: User) -> dict:
    today = date.today()
    week_start = today - timedelta(days=6)
    weekly = list_sleep_records(db, user.id, date_from=week_start, date_to=today)
    recent = list_sleep_records(db, user.id, limit=14)

    average_duration = (
        round(sum(item.duration_hours for item in weekly) / len(weekly), 1)
        if weekly
        else 0.0
    )
    average_quality = (
        round(sum(item.quality for item in weekly) / len(weekly), 1)
        if weekly
        else 0.0
    )
    bedtime_variation = _variation([_bedtime_axis(item.bedtime) for item in weekly])
    wake_variation = _variation([_minutes(item.wake_time) for item in weekly])
    combined_variation = (bedtime_variation + wake_variation) / 2
    consistency_score = (
        max(0, min(100, round(100 - combined_variation * 0.75))) if weekly else 0
    )

    by_date = {item.sleep_date: item for item in weekly}
    trend_points = []
    for offset in range(7):
        target = week_start + timedelta(days=offset)
        record = by_date.get(target)
        trend_points.append(
            {
                "date": target,
                "duration_hours": record.duration_hours if record else 0,
                "quality": record.quality if record else 0,
                "bedtime_minutes": _minutes(record.bedtime) if record else None,
                "wake_minutes": _minutes(record.wake_time) if record else None,
                "has_record": record is not None,
            }
        )

    return {
        "latest_record": recent[0] if recent else None,
        "average_duration": average_duration,
        "average_quality": average_quality,
        "bedtime_variation_minutes": bedtime_variation,
        "wake_variation_minutes": wake_variation,
        "consistency_score": consistency_score,
        "weekly_records": len(weekly),
        "insight": _insight(
            weekly, average_duration, bedtime_variation, wake_variation
        ),
        "trend_points": trend_points,
        "recent_records": recent,
    }


def delete_sleep_record(db: Session, user: User, record_id: int) -> None:
    record = get_sleep_record(db, user.id, record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sleep record not found",
        )
    db.delete(record)
    db.commit()
