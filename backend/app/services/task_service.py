from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task import Task, TaskCategory, TaskList
from app.models.user import User
from app.repositories.task_repo import get_category, get_list, get_task
from app.schemas.task_schema import CategoryCreate, TaskCreate, TaskListCreate, TaskUpdate


def ensure_defaults(db: Session, user: User) -> None:
    if not db.scalar(select(TaskList.id).where(TaskList.user_id == user.id).limit(1)):
        db.add(TaskList(user_id=user.id, name="My Tasks", color="#4a6ded", icon="inbox", is_default=True))
    if not db.scalar(select(TaskCategory.id).where(TaskCategory.user_id == user.id).limit(1)):
        db.add_all([
            TaskCategory(user_id=user.id, name="Work", color="#4a6ded"),
            TaskCategory(user_id=user.id, name="Study", color="#762bbc"),
            TaskCategory(user_id=user.id, name="Personal", color="#cf4de1"),
        ])
    db.commit()


def validate_ownership(db: Session, user_id: int, list_id: int | None, category_id: int | None) -> None:
    if list_id is not None and not get_list(db, user_id, list_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task list not found")
    if category_id is not None and not get_category(db, user_id, category_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task category not found")


def create_task(db: Session, user: User, data: TaskCreate) -> Task:
    ensure_defaults(db, user)
    validate_ownership(db, user.id, data.list_id, data.category_id)
    values = data.model_dump()
    values["subtasks"] = [item.model_dump() for item in data.subtasks]
    task = Task(user_id=user.id, **values)
    if task.status == "completed":
        task.completed_at = datetime.now(timezone.utc)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task(db: Session, user: User, task_id: int, data: TaskUpdate) -> Task:
    task = get_task(db, user.id, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    values = data.model_dump(exclude_unset=True)
    validate_ownership(db, user.id, values.get("list_id", task.list_id), values.get("category_id", task.category_id))
    if "subtasks" in values and values["subtasks"] is not None:
        values["subtasks"] = [item.model_dump() for item in values["subtasks"]]
    for key, value in values.items():
        setattr(task, key, value)
    if "status" in values:
        task.completed_at = datetime.now(timezone.utc) if task.status == "completed" else None
    task.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, user: User, task_id: int) -> None:
    task = get_task(db, user.id, task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    db.delete(task)
    db.commit()


def create_task_list(db: Session, user: User, data: TaskListCreate) -> TaskList:
    item = TaskList(user_id=user.id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def create_category(db: Session, user: User, data: CategoryCreate) -> TaskCategory:
    item = TaskCategory(user_id=user.id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def delete_task_list(db: Session, user: User, list_id: int) -> None:
    item = get_list(db, user.id, list_id)
    if not item:
        raise HTTPException(status_code=404, detail="Task list not found")
    if item.is_default:
        raise HTTPException(status_code=400, detail="The default task list cannot be deleted")
    db.query(Task).filter(Task.user_id == user.id, Task.list_id == list_id).update({Task.list_id: None})
    db.delete(item)
    db.commit()


def delete_category(db: Session, user: User, category_id: int) -> None:
    item = get_category(db, user.id, category_id)
    if not item:
        raise HTTPException(status_code=404, detail="Task category not found")
    db.query(Task).filter(Task.user_id == user.id, Task.category_id == category_id).update({Task.category_id: None})
    db.delete(item)
    db.commit()
