from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.life_balance import LifeBalanceCheckIn


def list_recent_checkins(db: Session, user_id: int, days: int = 90) -> list[LifeBalanceCheckIn]:
    since = date.today() - timedelta(days=days)
    return list(db.scalars(select(LifeBalanceCheckIn).where(LifeBalanceCheckIn.user_id == user_id, LifeBalanceCheckIn.checkin_date >= since).order_by(LifeBalanceCheckIn.checkin_date.desc(), LifeBalanceCheckIn.id.desc())))


def get_daily_checkin(db: Session, user_id: int, area_key: str, checkin_date: date) -> LifeBalanceCheckIn | None:
    return db.scalar(select(LifeBalanceCheckIn).where(LifeBalanceCheckIn.user_id == user_id, LifeBalanceCheckIn.area_key == area_key, LifeBalanceCheckIn.checkin_date == checkin_date))


def get_checkin(db: Session, user_id: int, checkin_id: int) -> LifeBalanceCheckIn | None:
    return db.scalar(select(LifeBalanceCheckIn).where(LifeBalanceCheckIn.user_id == user_id, LifeBalanceCheckIn.id == checkin_id))
