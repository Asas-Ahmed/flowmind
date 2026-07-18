from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.recovery_break import RecoveryBreak


def list_breaks(db: Session, user_id: int, *, date_from: datetime | None = None, limit: int | None = None) -> list[RecoveryBreak]:
    statement = select(RecoveryBreak).where(RecoveryBreak.user_id == user_id)
    if date_from is not None:
        statement = statement.where(RecoveryBreak.completed_at >= date_from)
    statement = statement.order_by(RecoveryBreak.completed_at.desc())
    if limit is not None:
        statement = statement.limit(limit)
    return list(db.scalars(statement).all())


def get_break(db: Session, user_id: int, break_id: int) -> RecoveryBreak | None:
    return db.scalar(
        select(RecoveryBreak).where(
            RecoveryBreak.id == break_id,
            RecoveryBreak.user_id == user_id,
        )
    )
