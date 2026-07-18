from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.distraction_log import DistractionLog


def list_distraction_logs(db: Session, user_id: int) -> list[DistractionLog]:
    return list(
        db.scalars(
            select(DistractionLog)
            .where(DistractionLog.user_id == user_id)
            .order_by(DistractionLog.occurred_at.desc(), DistractionLog.id.desc())
        ).all()
    )


def get_distraction_log(db: Session, user_id: int, log_id: int) -> DistractionLog | None:
    return db.scalar(
        select(DistractionLog).where(
            DistractionLog.id == log_id,
            DistractionLog.user_id == user_id,
        )
    )


def list_distractions_since(
    db: Session, user_id: int, since: datetime
) -> list[DistractionLog]:
    return list(
        db.scalars(
            select(DistractionLog).where(
                DistractionLog.user_id == user_id,
                DistractionLog.occurred_at >= since,
            )
        ).all()
    )
