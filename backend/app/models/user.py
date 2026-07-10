from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer, 
        primary_key=True, 
        index=True,
    )
    full_name: Mapped[str] = mapped_column(
        String(100), 
        nullable=False,
    )
    email: Mapped[str] = mapped_column(
        String(255), 
        unique=True, 
        index=True, 
        nullable=False,
    )
    hashed_password: Mapped[str] = mapped_column(
        String(255), 
        nullable=False,
    )

    password_reset_version: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    is_email_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    email_verification_version: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    verification_email_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    verification_email_daily_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    verification_email_count_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean, 
        default=True, 
        nullable=False,
    )
    is_admin: Mapped[bool] = mapped_column(
        Boolean, 
        default=False, 
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )