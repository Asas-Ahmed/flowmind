from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.database import Base


class NourishmentLog(Base):
    __tablename__ = "nourishment_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    amount_ml: Mapped[int | None] = mapped_column(Integer, nullable=True)
    meal_type: Mapped[str | None] = mapped_column(String(20), nullable=True)
    note: Mapped[str | None] = mapped_column(String(180), nullable=True)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
