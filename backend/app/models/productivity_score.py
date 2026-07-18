from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class ProductivityScore(Base):
    __tablename__ = "productivity_scores"
    __table_args__ = (
        UniqueConstraint("user_id", "score_date", name="uq_productivity_score_user_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    score_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    task_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    habit_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    focus_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    overdue_penalty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    level: Mapped[str] = mapped_column(String(30), nullable=False, default="Getting started")
    metrics: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    calculated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
