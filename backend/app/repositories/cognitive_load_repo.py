from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.cognitive_load import CognitiveLoadEntry


def list_cognitive_load_entries(
    db: Session,
    user_id: int,
    *,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int | None = None,
) -> list[CognitiveLoadEntry]:
    statement = select(CognitiveLoadEntry).where(CognitiveLoadEntry.user_id == user_id)
    if date_from is not None:
        statement = statement.where(CognitiveLoadEntry.entry_date >= date_from)
    if date_to is not None:
        statement = statement.where(CognitiveLoadEntry.entry_date <= date_to)
    statement = statement.order_by(
        CognitiveLoadEntry.entry_date.desc(), CognitiveLoadEntry.id.desc()
    )
    if limit is not None:
        statement = statement.limit(limit)
    return list(db.scalars(statement).all())


def get_cognitive_load_entry(
    db: Session, user_id: int, entry_id: int
) -> CognitiveLoadEntry | None:
    return db.scalar(
        select(CognitiveLoadEntry).where(
            CognitiveLoadEntry.id == entry_id,
            CognitiveLoadEntry.user_id == user_id,
        )
    )
