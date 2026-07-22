from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database.database import Base

class QuitJourney(Base):
    __tablename__ = "quit_journeys"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="other")
    icon: Mapped[str] = mapped_column(String(40), default="shield")
    color: Mapped[str] = mapped_column(String(20), default="#7c3aed")
    quit_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    birth_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    why: Mapped[list[str]] = mapped_column(JSON, default=list)
    triggers: Mapped[list[str]] = mapped_column(JSON, default=list)
    strategy: Mapped[str | None] = mapped_column(Text, nullable=True)
    cost_per_occurrence: Mapped[float] = mapped_column(Float, default=0)
    minutes_per_occurrence: Mapped[int] = mapped_column(Integer, default=0)
    occurrences_per_week: Mapped[float] = mapped_column(Float, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class QuitReset(Base):
    __tablename__ = "quit_resets"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    journey_id: Mapped[int] = mapped_column(ForeignKey("quit_journeys.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    reset_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    previous_quit_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    note: Mapped[str | None] = mapped_column(String(500), nullable=True)
    trigger: Mapped[str | None] = mapped_column(String(120), nullable=True)

class QuitReward(Base):
    __tablename__ = "quit_rewards"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    journey_id: Mapped[int] = mapped_column(ForeignKey("quit_journeys.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    target_days: Mapped[int] = mapped_column(Integer, default=7)
    estimated_cost: Mapped[float] = mapped_column(Float, default=0)
    purchased: Mapped[bool] = mapped_column(Boolean, default=False)
    purchased_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
