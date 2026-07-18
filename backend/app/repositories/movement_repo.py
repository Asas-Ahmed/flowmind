from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.movement_break import MovementBreak


def list_movement_breaks(
    db: Session,
    user_id: int,
    *,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int | None = None,
) -> list[MovementBreak]:
    statement = select(MovementBreak).where(MovementBreak.user_id == user_id)
    if date_from is not None:
        statement = statement.where(MovementBreak.completed_at >= date_from)
    if date_to is not None:
        statement = statement.where(MovementBreak.completed_at < date_to)
    statement = statement.order_by(MovementBreak.completed_at.desc())
    if limit is not None:
        statement = statement.limit(limit)
    return list(db.scalars(statement).all())


def get_movement_break(
    db: Session, user_id: int, break_id: int
) -> MovementBreak | None:
    return db.scalar(
        select(MovementBreak).where(
            MovementBreak.id == break_id,
            MovementBreak.user_id == user_id,
        )
    )


def latest_completed_break(db: Session, user_id: int) -> MovementBreak | None:
    statement = (
        select(MovementBreak)
        .where(
            MovementBreak.user_id == user_id,
            MovementBreak.status == "completed",
        )
        .order_by(MovementBreak.completed_at.desc())
        .limit(1)
    )
    return db.scalar(statement)
