from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.schedule_event import ScheduleEvent


def get_event(db: Session, user_id: int, event_id: int) -> ScheduleEvent | None:
    return db.scalar(
        select(ScheduleEvent).where(
            ScheduleEvent.id == event_id,
            ScheduleEvent.user_id == user_id,
        )
    )


def list_events(
    db: Session,
    user_id: int,
    *,
    range_start: datetime,
    range_end: datetime,
) -> list[ScheduleEvent]:
    statement = (
        select(ScheduleEvent)
        .where(
            ScheduleEvent.user_id == user_id,
            ScheduleEvent.start_at < range_end,
            ScheduleEvent.end_at >= range_start,
        )
        .order_by(ScheduleEvent.start_at.asc())
    )
    return list(db.scalars(statement).all())
