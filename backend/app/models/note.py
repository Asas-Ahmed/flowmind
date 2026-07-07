from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database.database import Base


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    text: Mapped[str] = mapped_column(String(255), nullable=False)