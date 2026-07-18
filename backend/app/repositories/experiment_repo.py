from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.productivity_experiment import ProductivityExperiment


def list_experiments(db: Session, user_id: int) -> list[ProductivityExperiment]:
    return list(
        db.scalars(
            select(ProductivityExperiment)
            .options(selectinload(ProductivityExperiment.trials))
            .where(ProductivityExperiment.user_id == user_id)
            .order_by(ProductivityExperiment.created_at.desc(), ProductivityExperiment.id.desc())
        ).all()
    )


def get_experiment(db: Session, user_id: int, experiment_id: int) -> ProductivityExperiment | None:
    return db.scalar(
        select(ProductivityExperiment)
        .options(selectinload(ProductivityExperiment.trials))
        .where(
            ProductivityExperiment.id == experiment_id,
            ProductivityExperiment.user_id == user_id,
        )
    )
