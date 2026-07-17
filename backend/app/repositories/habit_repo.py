from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.habit import Habit, HabitCompletion


def get_habit(db: Session, user_id: int, habit_id: int) -> Habit | None:
    return db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id))


def list_habits(db: Session, user_id: int, include_archived: bool = False) -> list[Habit]:
    statement = select(Habit).where(Habit.user_id == user_id)
    if not include_archived:
        statement = statement.where(Habit.is_archived.is_(False))
    return list(db.scalars(statement.order_by(Habit.created_at.desc())).all())


def get_completion(
    db: Session, user_id: int, habit_id: int, completion_date: date
) -> HabitCompletion | None:
    return db.scalar(
        select(HabitCompletion).where(
            HabitCompletion.user_id == user_id,
            HabitCompletion.habit_id == habit_id,
            HabitCompletion.completion_date == completion_date,
        )
    )


def list_completions(
    db: Session,
    user_id: int,
    *,
    habit_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> list[HabitCompletion]:
    statement = select(HabitCompletion).where(HabitCompletion.user_id == user_id)
    if habit_id is not None:
        statement = statement.where(HabitCompletion.habit_id == habit_id)
    if date_from is not None:
        statement = statement.where(HabitCompletion.completion_date >= date_from)
    if date_to is not None:
        statement = statement.where(HabitCompletion.completion_date <= date_to)
    return list(
        db.scalars(statement.order_by(HabitCompletion.completion_date.desc())).all()
    )
