from datetime import datetime

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.auth import get_current_user
from app.database.database import get_db
from app.models.user import User
from app.repositories.task_repo import get_categories, get_lists, list_tasks
from app.schemas.task_schema import (
    CategoryCreate,
    CategoryResponse,
    TaskCreate,
    TaskListCreate,
    TaskListResponse,
    TaskResponse,
    TaskUpdate,
    TaskWorkspaceResponse,
)
from app.services.task_service import (
    create_category,
    create_task,
    create_task_list,
    delete_category,
    delete_task,
    delete_task_list,
    ensure_defaults,
    update_task,
)

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@router.get("/workspace", response_model=TaskWorkspaceResponse)
def workspace(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ensure_defaults(db, current_user)
    return {
        "tasks": list_tasks(db, current_user.id),
        "lists": get_lists(db, current_user.id),
        "categories": get_categories(db, current_user.id),
    }


@router.get("", response_model=list[TaskResponse])
def read_tasks(
    task_status: str | None = Query(default=None, alias="status"),
    list_id: int | None = None,
    category_id: int | None = None,
    search: str | None = None,
    due_from: datetime | None = None,
    due_to: datetime | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_tasks(db, current_user.id, status=task_status, list_id=list_id, category_id=category_id, search=search, due_from=due_from, due_to=due_to)


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def add_task(data: TaskCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_task(db, current_user, data)


@router.put("/{task_id}", response_model=TaskResponse)
def edit_task(task_id: int, data: TaskUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return update_task(db, current_user, task_id, data)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_task(task_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    delete_task(db, current_user, task_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/lists", response_model=TaskListResponse, status_code=status.HTTP_201_CREATED)
def add_list(data: TaskListCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_task_list(db, current_user, data)


@router.delete("/lists/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_list(list_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    delete_task_list(db, current_user, list_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def add_category(data: CategoryCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return create_category(db, current_user, data)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_category(category_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    delete_category(db, current_user, category_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
