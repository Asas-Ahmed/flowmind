from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class ProcrastinationStarter(Base):
    __tablename__ = "procrastination_starters"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    task_name: Mapped[str] = mapped_column(String(160), nullable=False)
    obstacle: Mapped[str | None] = mapped_column(Text, nullable=True)
    technique: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    first_step: Mapped[str] = mapped_column(String(240), nullable=False)
    starter_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
