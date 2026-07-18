from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class MovementBreak(Base):
    __tablename__ = "movement_breaks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    routine: Mapped[str] = mapped_column(String(40), nullable=False, default="full_body")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="completed", index=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=120)
    trigger_focus_sessions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
