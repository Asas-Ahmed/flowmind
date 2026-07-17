from datetime import datetime

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.task import Task, TaskCategory, TaskList


def get_task(db: Session, user_id: int, task_id: int) -> Task | None:
    return db.scalar(select(Task).where(Task.id == task_id, Task.user_id == user_id))


def list_tasks(
    db: Session,
    user_id: int,
    *,
    status: str | None = None,
    list_id: int | None = None,
    category_id: int | None = None,
    search: str | None = None,
    due_from: datetime | None = None,
    due_to: datetime | None = None,
) -> list[Task]:
    statement = select(Task).where(Task.user_id == user_id)
    if status:
        statement = statement.where(Task.status == status)
    if list_id:
        statement = statement.where(Task.list_id == list_id)
    if category_id:
        statement = statement.where(Task.category_id == category_id)
    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(or_(Task.title.ilike(pattern), Task.description.ilike(pattern)))
    if due_from:
        statement = statement.where(Task.due_at >= due_from)
    if due_to:
        statement = statement.where(Task.due_at <= due_to)
    return list(db.scalars(statement.order_by(Task.due_at.asc().nullslast(), Task.created_at.desc())).all())


def get_lists(db: Session, user_id: int) -> list[TaskList]:
    return list(db.scalars(select(TaskList).where(TaskList.user_id == user_id).order_by(TaskList.is_default.desc(), TaskList.name)).all())


def get_categories(db: Session, user_id: int) -> list[TaskCategory]:
    return list(db.scalars(select(TaskCategory).where(TaskCategory.user_id == user_id).order_by(TaskCategory.name)).all())


def get_list(db: Session, user_id: int, list_id: int) -> TaskList | None:
    return db.scalar(select(TaskList).where(TaskList.id == list_id, TaskList.user_id == user_id))


def get_category(db: Session, user_id: int, category_id: int) -> TaskCategory | None:
    return db.scalar(select(TaskCategory).where(TaskCategory.id == category_id, TaskCategory.user_id == user_id))
