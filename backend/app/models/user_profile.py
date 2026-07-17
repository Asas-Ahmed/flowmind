from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    timezone: Mapped[str] = mapped_column(
        String(100),
        default="Asia/Colombo",
        nullable=False,
    )

    daily_focus_goal_minutes: Mapped[int] = mapped_column(
        Integer,
        default=120,
        nullable=False,
    )

    week_starts_on: Mapped[str] = mapped_column(
        String(10),
        default="monday",
        nullable=False,
    )

    email_notifications: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    task_reminders: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    habit_reminders: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    weekly_summary: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    compact_dashboard: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )