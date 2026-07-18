from collections import Counter
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.procrastination_starter import ProcrastinationStarter
from app.models.user import User
from app.repositories.procrastination_repo import get_starter, list_starters
from app.schemas.procrastination_schema import ProcrastinationStarterCreate


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None


def create_starter(
    db: Session, user: User, data: ProcrastinationStarterCreate
) -> ProcrastinationStarter:
    starter = ProcrastinationStarter(
        user_id=user.id,
        task_name=data.task_name.strip(),
        obstacle=_clean(data.obstacle),
        technique=data.technique,
        first_step=data.first_step.strip(),
        starter_minutes=data.starter_minutes,
    )
    db.add(starter)
    db.commit()
    db.refresh(starter)
    return starter


def toggle_starter(
    db: Session, user: User, starter_id: int
) -> ProcrastinationStarter:
    starter = get_starter(db, user.id, starter_id)
    if starter is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Starter plan not found",
        )

    starter.is_completed = not starter.is_completed
    starter.completed_at = datetime.now(timezone.utc) if starter.is_completed else None
    db.commit()
    db.refresh(starter)
    return starter


def delete_starter(db: Session, user: User, starter_id: int) -> None:
    starter = get_starter(db, user.id, starter_id)
    if starter is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Starter plan not found",
        )
    db.delete(starter)
    db.commit()


def get_workspace(db: Session, user: User) -> dict:
    starters = list_starters(db, user.id)
    total = len(starters)
    completed = sum(1 for item in starters if item.is_completed)
    active = total - completed
    rate = round((completed / total) * 100, 1) if total else 0.0
    technique_counts = Counter(item.technique for item in starters)
    most_used = technique_counts.most_common(1)[0][0] if technique_counts else None

    if not starters:
        insight = {
            "title": "Starting is the only goal",
            "message": "Turn one avoided task into a tiny action that feels too easy to postpone.",
            "next_action": "Choose a task and define a first step that takes five minutes or less.",
            "tone": "neutral",
        }
    elif active >= 4:
        insight = {
            "title": "Your starter list is getting heavy",
            "message": f"You currently have {active} unfinished starter plans.",
            "next_action": "Pick the smallest first step, complete it, and archive the mental pressure before adding another.",
            "tone": "attention",
        }
    elif rate >= 70:
        insight = {
            "title": "Small starts are working",
            "message": f"You completed {rate:.0f}% of your saved starter plans.",
            "next_action": "Reuse your most successful technique on the next task you feel tempted to avoid.",
            "tone": "positive",
        }
    else:
        insight = {
            "title": "Reduce the entry cost",
            "message": "A starter plan should remove uncertainty, effort, or setup from the first action.",
            "next_action": "Rewrite one unfinished step until it begins with a visible action such as open, write, read, or send.",
            "tone": "neutral",
        }

    return {
        "total_starters": total,
        "completed_starters": completed,
        "completion_rate": rate,
        "active_starters": active,
        "most_used_technique": most_used,
        "insight": insight,
        "starters": starters,
    }
