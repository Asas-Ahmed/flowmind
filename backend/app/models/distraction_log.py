from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class DistractionLog(Base):
    __tablename__ = "distraction_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    distraction_type: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    context: Mapped[str] = mapped_column(String(40), nullable=False, default="other", index=True)
    intensity: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    minutes_lost: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    recovery_action: Mapped[str | None] = mapped_column(String(180), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
