from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.if_then_plan import IfThenPlan


def list_if_then_plans(db: Session, user_id: int) -> list[IfThenPlan]:
    return list(
        db.scalars(
            select(IfThenPlan)
            .where(IfThenPlan.user_id == user_id)
            .order_by(IfThenPlan.is_active.desc(), IfThenPlan.updated_at.desc())
        ).all()
    )


def get_if_then_plan(db: Session, user_id: int, plan_id: int) -> IfThenPlan | None:
    return db.scalar(
        select(IfThenPlan).where(
            IfThenPlan.id == plan_id,
            IfThenPlan.user_id == user_id,
        )
    )
