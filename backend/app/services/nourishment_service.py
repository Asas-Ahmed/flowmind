from datetime import date, datetime, time, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.nourishment_log import NourishmentLog
from app.models.user import User
from app.repositories.nourishment_repo import get_log, list_logs
from app.schemas.nourishment_schema import NourishmentLogCreate

WATER_TARGET_ML = 2000
MEAL_TARGET = 3


def _day_start(day: date) -> datetime:
    return datetime.combine(day, time.min, tzinfo=timezone.utc)


def _streak(logs: list[NourishmentLog], today: date) -> int:
    days = {}
    for log in logs:
        bucket = days.setdefault(log.logged_at.date(), {"water": 0, "meals": 0})
        if log.kind == "water": bucket["water"] += log.amount_ml or 0
        else: bucket["meals"] += 1
    current = 0
    cursor = today
    while cursor in days and (days[cursor]["water"] >= 1000 or days[cursor]["meals"] >= 2):
        current += 1
        cursor -= timedelta(days=1)
    return current


def get_nourishment_workspace(db: Session, user: User) -> dict:
    now = datetime.now(timezone.utc)
    today = now.date()
    week_start = today - timedelta(days=6)
    week_logs = list_logs(db, user.id, date_from=_day_start(week_start))
    recent = list_logs(db, user.id, limit=12)
    today_logs = [log for log in week_logs if log.logged_at.date() == today]
    water = sum(log.amount_ml or 0 for log in today_logs if log.kind == "water")
    meals = sum(1 for log in today_logs if log.kind == "meal")
    last_water = next((log for log in recent if log.kind == "water"), None)
    last_meal = next((log for log in recent if log.kind == "meal"), None)
    hydration_due = last_water is None or now - last_water.logged_at >= timedelta(hours=2)
    hour = now.hour
    expected_meals = 1 if hour >= 9 else 0
    expected_meals += 1 if hour >= 14 else 0
    expected_meals += 1 if hour >= 20 else 0
    meal_due = meals < expected_meals and (last_meal is None or now - last_meal.logged_at >= timedelta(hours=3))

    points = []
    for offset in range(7):
        target = week_start + timedelta(days=offset)
        matches = [log for log in week_logs if log.logged_at.date() == target]
        points.append({
            "date": target,
            "water_ml": sum(log.amount_ml or 0 for log in matches if log.kind == "water"),
            "meals": sum(1 for log in matches if log.kind == "meal"),
        })

    if hydration_due:
        title = "A water break may help"
        message = "It has been a while since your last hydration log. Add a glass of water when convenient."
    elif meal_due:
        title = "Protect a regular meal window"
        message = "Your recent log suggests a meal may be due. FlowMind is offering awareness, not dietary advice."
    else:
        title = "Your nourishment rhythm looks supported"
        message = "Keep using quick logs to notice patterns without turning meals or water into pressure."

    return {
        "water_target_ml": WATER_TARGET_ML,
        "today_water_ml": water,
        "water_progress": round(min(100, water / WATER_TARGET_ML * 100), 1),
        "today_meals": meals,
        "meals_progress": round(min(100, meals / MEAL_TARGET * 100), 1),
        "hydration_due": hydration_due,
        "meal_due": meal_due,
        "current_streak": _streak(week_logs, today),
        "weekly_water_average_ml": round(sum(point["water_ml"] for point in points) / 7),
        "weekly_meal_average": round(sum(point["meals"] for point in points) / 7, 1),
        "assistant_title": title,
        "assistant_message": message,
        "recent_logs": recent,
        "daily_points": points,
    }


def create_nourishment_log(db: Session, user: User, data: NourishmentLogCreate) -> NourishmentLog:
    record = NourishmentLog(user_id=user.id, kind=data.kind, amount_ml=data.amount_ml if data.kind == "water" else None, meal_type=data.meal_type if data.kind == "meal" else None, note=data.note.strip() if data.note else None)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def delete_nourishment_log(db: Session, user: User, log_id: int) -> None:
    record = get_log(db, user.id, log_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hydration or meal log not found")
    db.delete(record)
    db.commit()
