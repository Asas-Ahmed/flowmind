from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.goal import ProductivityGoal


def list_goals(db: Session, user_id: int) -> list[ProductivityGoal]:
    return list(db.scalars(select(ProductivityGoal).where(ProductivityGoal.user_id == user_id).order_by(ProductivityGoal.created_at)))


def get_goal(db: Session, user_id: int, goal_id: int) -> ProductivityGoal | None:
    return db.scalar(select(ProductivityGoal).where(ProductivityGoal.id == goal_id, ProductivityGoal.user_id == user_id))
