from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.database import Base


class ProductivityExperiment(Base):
    __tablename__ = "productivity_experiments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    hypothesis: Mapped[str | None] = mapped_column(Text, nullable=True)
    condition_a: Mapped[str] = mapped_column(String(160), nullable=False)
    condition_b: Mapped[str] = mapped_column(String(160), nullable=False)
    metric: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="active", index=True)
    winner: Mapped[str | None] = mapped_column(String(1), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    trials: Mapped[list["ProductivityExperimentTrial"]] = relationship(
        back_populates="experiment", cascade="all, delete-orphan", passive_deletes=True
    )


class ProductivityExperimentTrial(Base):
    __tablename__ = "productivity_experiment_trials"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    experiment_id: Mapped[int] = mapped_column(
        ForeignKey("productivity_experiments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    condition: Mapped[str] = mapped_column(String(1), nullable=False, index=True)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    experiment: Mapped[ProductivityExperiment] = relationship(back_populates="trials")
