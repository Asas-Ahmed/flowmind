from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.energy_checkin import EnergyCheckIn


def list_energy_checkins(
    db: Session,
    user_id: int,
    *,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    limit: int | None = None,
) -> list[EnergyCheckIn]:
    statement = select(EnergyCheckIn).where(EnergyCheckIn.user_id == user_id)
    if date_from is not None:
        statement = statement.where(EnergyCheckIn.checked_at >= date_from)
    if date_to is not None:
        statement = statement.where(EnergyCheckIn.checked_at < date_to)
    statement = statement.order_by(EnergyCheckIn.checked_at.desc())
    if limit is not None:
        statement = statement.limit(limit)
    return list(db.scalars(statement).all())


def get_energy_checkin(
    db: Session, user_id: int, checkin_id: int
) -> EnergyCheckIn | None:
    return db.scalar(
        select(EnergyCheckIn).where(
            EnergyCheckIn.id == checkin_id,
            EnergyCheckIn.user_id == user_id,
        )
    )
