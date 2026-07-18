from collections import defaultdict
from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.cognitive_load import CognitiveLoadEntry
from app.models.user import User
from app.repositories.cognitive_load_repo import (
    get_cognitive_load_entry,
    list_cognitive_load_entries,
)
from app.schemas.cognitive_load_schema import CognitiveLoadEntryCreate

DIFFICULTY_POINTS = {"light": 1, "moderate": 2, "deep": 3}


def _entry_points(entry: CognitiveLoadEntry) -> int:
    base = DIFFICULTY_POINTS[entry.difficulty]
    duration_multiplier = max(1, round(entry.estimated_minutes / 60))
    return base * duration_multiplier


def _load_level(score: int) -> str:
    if score == 0:
        return "empty"
    if score <= 3:
        return "light"
    if score <= 7:
        return "balanced"
    if score <= 10:
        return "high"
    return "overloaded"


def _insight(score: int, deep_count: int, estimated_minutes: int) -> dict[str, str]:
    if score == 0:
        return {
            "key": "start_planning",
            "title": "Plan your mental workload",
            "message": "No cognitive work items are recorded for today yet.",
            "action": "Add your planned tasks and classify each as light, moderate, or deep.",
            "tone": "neutral",
        }
    if score > 10 or deep_count >= 4:
        return {
            "key": "overloaded",
            "title": "Today may be cognitively overloaded",
            "message": "Your plan contains more demanding work than a balanced day usually supports.",
            "action": "Move one deep item to another day or reduce it to a smaller first step.",
            "tone": "attention",
        }
    if score >= 8:
        return {
            "key": "high_load",
            "title": "Protect recovery between demanding tasks",
            "message": "Your cognitive load is high but may remain manageable with deliberate breaks.",
            "action": "Avoid placing deep tasks back-to-back and schedule a recovery block.",
            "tone": "attention",
        }
    if deep_count > 0 and estimated_minutes >= 180:
        return {
            "key": "deep_work_day",
            "title": "You have a focused workday planned",
            "message": "Your schedule includes meaningful deep work without exceeding the daily target.",
            "action": "Start the hardest item during your strongest focus window.",
            "tone": "positive",
        }
    if score <= 3:
        return {
            "key": "light_day",
            "title": "Your mental workload is light",
            "message": "Today has spare cognitive capacity based on the items you recorded.",
            "action": "Keep the lighter day for recovery or add one meaningful priority if needed.",
            "tone": "balanced",
        }
    return {
        "key": "balanced_day",
        "title": "Your cognitive load looks balanced",
        "message": "The mix of light, moderate, and deep work is within the recommended daily range.",
        "action": "Maintain the plan and review how your energy changes after each demanding item.",
        "tone": "positive",
    }


def create_cognitive_load_entry(
    db: Session, user: User, data: CognitiveLoadEntryCreate
) -> CognitiveLoadEntry:
    if data.entry_date > date.today() + timedelta(days=30):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cognitive load items can only be planned up to 30 days ahead",
        )

    entry = CognitiveLoadEntry(
        user_id=user.id,
        entry_date=data.entry_date,
        title=data.title.strip(),
        difficulty=data.difficulty,
        estimated_minutes=data.estimated_minutes,
        note=data.note.strip() if data.note and data.note.strip() else None,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_cognitive_load_workspace(db: Session, user: User) -> dict:
    today = date.today()
    week_start = today - timedelta(days=6)
    weekly_entries = list_cognitive_load_entries(
        db, user.id, date_from=week_start, date_to=today
    )
    today_entries = [entry for entry in weekly_entries if entry.entry_date == today]
    recent_entries = list_cognitive_load_entries(db, user.id, limit=20)

    today_score = sum(_entry_points(entry) for entry in today_entries)
    counts = {
        difficulty: sum(1 for entry in today_entries if entry.difficulty == difficulty)
        for difficulty in DIFFICULTY_POINTS
    }
    estimated_minutes = sum(entry.estimated_minutes for entry in today_entries)

    grouped: dict[date, list[CognitiveLoadEntry]] = defaultdict(list)
    for entry in weekly_entries:
        grouped[entry.entry_date].append(entry)

    week_points = []
    daily_scores = []
    for offset in range(7):
        current = week_start + timedelta(days=offset)
        entries = grouped[current]
        score = sum(_entry_points(entry) for entry in entries)
        daily_scores.append(score)
        week_points.append(
            {
                "date": current,
                "score": score,
                "light_count": sum(1 for item in entries if item.difficulty == "light"),
                "moderate_count": sum(
                    1 for item in entries if item.difficulty == "moderate"
                ),
                "deep_count": sum(1 for item in entries if item.difficulty == "deep"),
            }
        )

    return {
        "today_score": today_score,
        "capacity_score": max(0, min(100, round(100 - (today_score / 12) * 100))),
        "load_level": _load_level(today_score),
        "today_entries": len(today_entries),
        "light_count": counts["light"],
        "moderate_count": counts["moderate"],
        "deep_count": counts["deep"],
        "estimated_minutes": estimated_minutes,
        "weekly_average": round(sum(daily_scores) / 7, 1),
        "insight": _insight(today_score, counts["deep"], estimated_minutes),
        "week_points": week_points,
        "recent_entries": recent_entries,
    }


def delete_cognitive_load_entry(db: Session, user: User, entry_id: int) -> None:
    entry = get_cognitive_load_entry(db, user.id, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cognitive load item not found",
        )
    db.delete(entry)
    db.commit()
