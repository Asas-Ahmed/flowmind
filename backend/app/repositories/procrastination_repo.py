from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.procrastination_starter import ProcrastinationStarter


def list_starters(db: Session, user_id: int) -> list[ProcrastinationStarter]:
    return list(
        db.scalars(
            select(ProcrastinationStarter)
            .where(ProcrastinationStarter.user_id == user_id)
            .order_by(ProcrastinationStarter.created_at.desc(), ProcrastinationStarter.id.desc())
        ).all()
    )


def get_starter(
    db: Session, user_id: int, starter_id: int
) -> ProcrastinationStarter | None:
    return db.scalar(
        select(ProcrastinationStarter).where(
            ProcrastinationStarter.id == starter_id,
            ProcrastinationStarter.user_id == user_id,
        )
    )
