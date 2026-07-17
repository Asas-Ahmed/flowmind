from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.focus_session import FocusSession


def get_session(db: Session, user_id: int, session_id: int) -> FocusSession | None:
    return db.scalar(
        select(FocusSession).where(
            FocusSession.id == session_id,
            FocusSession.user_id == user_id,
        )
    )


def get_active_session(db: Session, user_id: int) -> FocusSession | None:
    return db.scalar(
        select(FocusSession)
        .where(
            FocusSession.user_id == user_id,
            FocusSession.status.in_(["active", "paused"]),
        )
        .order_by(FocusSession.started_at.desc())
    )


def list_sessions(
    db: Session,
    user_id: int,
    *,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int | None = None,
) -> list[FocusSession]:
    statement = select(FocusSession).where(FocusSession.user_id == user_id)
    if date_from is not None:
        statement = statement.where(FocusSession.started_at >= date_from)
    if date_to is not None:
        statement = statement.where(FocusSession.started_at < date_to)
    statement = statement.order_by(FocusSession.started_at.desc())
    if limit is not None:
        statement = statement.limit(limit)
    return list(db.scalars(statement).all())
