from datetime import date, datetime, time, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.energy_checkin import EnergyCheckIn
from app.models.user import User
from app.repositories.energy_repo import get_energy_checkin, list_energy_checkins
from app.schemas.energy_schema import EnergyCheckInCreate


def _utc_day_bounds(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time.min, tzinfo=timezone.utc)
    return start, start + timedelta(days=1)


def _recommendation(energy: int, stress: int, focus: int) -> dict[str, str]:
    if stress == 3:
        return {
            "key": "recovery_first",
            "title": "Reduce pressure before pushing harder",
            "message": "Your stress is high. Protect momentum with a short recovery break and a smaller next step.",
            "action": "Take a 5-minute recovery break, then choose one light task.",
            "tone": "recovery",
        }
    if energy == 1:
        return {
            "key": "low_energy_plan",
            "title": "Use a low-energy plan",
            "message": "Your energy is limited right now. Administrative or easy tasks are a better fit than demanding deep work.",
            "action": "Complete one short task or prepare your workspace for later.",
            "tone": "calm",
        }
    if focus == 3 and energy >= 2 and stress <= 2:
        return {
            "key": "deep_work_window",
            "title": "Use this deep-work window",
            "message": "Your focus and energy are ready for demanding work. Protect this period from interruptions.",
            "action": "Start a focused session on your highest-value task.",
            "tone": "focus",
        }
    if energy == 3 and focus <= 2:
        return {
            "key": "activate_focus",
            "title": "Turn energy into momentum",
            "message": "You have useful energy, but focus is not fully settled. A clear first action can create momentum.",
            "action": "Choose one task, remove distractions, and work for 15 minutes.",
            "tone": "momentum",
        }
    if focus == 1:
        return {
            "key": "focus_reset",
            "title": "Reset before concentrated work",
            "message": "Your focus is currently low. Avoid forcing a long session before reducing distractions.",
            "action": "Clear your desk, silence notifications, and begin with five minutes.",
            "tone": "calm",
        }
    return {
        "key": "balanced_plan",
        "title": "Use a balanced work block",
        "message": "Your current state supports steady progress without needing an intense workload.",
        "action": "Choose one important task and complete a focused 25-minute block.",
        "tone": "focus",
    }


def create_energy_checkin(
    db: Session, user: User, data: EnergyCheckInCreate
) -> EnergyCheckIn:
    recommendation = _recommendation(
        data.energy_level, data.stress_level, data.focus_level
    )
    record = EnergyCheckIn(
        user_id=user.id,
        energy_level=data.energy_level,
        stress_level=data.stress_level,
        focus_level=data.focus_level,
        note=data.note.strip() if data.note and data.note.strip() else None,
        recommendation_key=recommendation["key"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_energy_workspace(db: Session, user: User) -> dict:
    now = datetime.now(timezone.utc)
    today = now.date()
    week_start = today - timedelta(days=6)
    week_from, _ = _utc_day_bounds(week_start)
    _, today_to = _utc_day_bounds(today)

    weekly = list_energy_checkins(
        db, user.id, date_from=week_from, date_to=today_to
    )
    recent = list_energy_checkins(db, user.id, limit=10)
    latest = recent[0] if recent else None

    def average(attribute: str) -> float:
        if not weekly:
            return 0.0
        return round(sum(getattr(item, attribute) for item in weekly) / len(weekly), 1)

    avg_energy = average("energy_level")
    avg_stress = average("stress_level")
    avg_focus = average("focus_level")

    strongest_state = "No pattern yet"
    if weekly:
        values = {
            "Energy": avg_energy,
            "Calm": round(4 - avg_stress, 1),
            "Focus": avg_focus,
        }
        strongest_state = max(values, key=values.get)

    trend_points = []
    for offset in range(7):
        target = week_start + timedelta(days=offset)
        matches = [item for item in weekly if item.checked_at.date() == target]
        trend_points.append(
            {
                "date": target,
                "energy": round(
                    sum(item.energy_level for item in matches) / len(matches), 1
                ) if matches else 0,
                "stress": round(
                    sum(item.stress_level for item in matches) / len(matches), 1
                ) if matches else 0,
                "focus": round(
                    sum(item.focus_level for item in matches) / len(matches), 1
                ) if matches else 0,
                "checkins": len(matches),
            }
        )

    current_values = (
        (latest.energy_level, latest.stress_level, latest.focus_level)
        if latest
        else (2, 2, 2)
    )

    return {
        "latest_checkin": latest,
        "recommendation": _recommendation(*current_values),
        "today_checkins": sum(1 for item in weekly if item.checked_at.date() == today),
        "weekly_checkins": len(weekly),
        "average_energy": avg_energy,
        "average_stress": avg_stress,
        "average_focus": avg_focus,
        "strongest_state": strongest_state,
        "trend_points": trend_points,
        "recent_checkins": recent,
    }


def delete_energy_checkin(db: Session, user: User, checkin_id: int) -> None:
    record = get_energy_checkin(db, user.id, checkin_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Energy check-in not found",
        )
    db.delete(record)
    db.commit()
