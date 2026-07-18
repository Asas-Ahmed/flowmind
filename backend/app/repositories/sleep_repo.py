from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.sleep_record import SleepRecord


def list_sleep_records(
    db: Session,
    user_id: int,
    *,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int | None = None,
) -> list[SleepRecord]:
    statement = select(SleepRecord).where(SleepRecord.user_id == user_id)
    if date_from is not None:
        statement = statement.where(SleepRecord.sleep_date >= date_from)
    if date_to is not None:
        statement = statement.where(SleepRecord.sleep_date <= date_to)
    statement = statement.order_by(SleepRecord.sleep_date.desc(), SleepRecord.id.desc())
    if limit is not None:
        statement = statement.limit(limit)
    return list(db.scalars(statement).all())


def get_sleep_record(db: Session, user_id: int, record_id: int) -> SleepRecord | None:
    return db.scalar(
        select(SleepRecord).where(
            SleepRecord.id == record_id,
            SleepRecord.user_id == user_id,
        )
    )


def get_sleep_record_for_date(
    db: Session, user_id: int, sleep_date: date
) -> SleepRecord | None:
    return db.scalar(
        select(SleepRecord).where(
            SleepRecord.user_id == user_id,
            SleepRecord.sleep_date == sleep_date,
        )
    )
