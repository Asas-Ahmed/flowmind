from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.nourishment_log import NourishmentLog


def list_logs(db: Session, user_id: int, *, date_from: datetime | None = None, limit: int | None = None) -> list[NourishmentLog]:
    statement = select(NourishmentLog).where(NourishmentLog.user_id == user_id)
    if date_from is not None:
        statement = statement.where(NourishmentLog.logged_at >= date_from)
    statement = statement.order_by(NourishmentLog.logged_at.desc())
    if limit is not None:
        statement = statement.limit(limit)
    return list(db.scalars(statement).all())


def get_log(db: Session, user_id: int, log_id: int) -> NourishmentLog | None:
    return db.scalar(select(NourishmentLog).where(NourishmentLog.id == log_id, NourishmentLog.user_id == user_id))
