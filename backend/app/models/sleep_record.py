from datetime import date, datetime, time, timezone

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, Text, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class SleepRecord(Base):
    __tablename__ = "sleep_records"
    __table_args__ = (
        UniqueConstraint("user_id", "sleep_date", name="uq_sleep_records_user_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sleep_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    bedtime: Mapped[time] = mapped_column(Time, nullable=False)
    wake_time: Mapped[time] = mapped_column(Time, nullable=False)
    duration_hours: Mapped[float] = mapped_column(Float, nullable=False)
    quality: Mapped[int] = mapped_column(Integer, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
