from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.focus_session import FocusSession
from app.models.goal import ProductivityGoal
from app.models.habit import HabitCompletion
from app.models.task import Task
from app.models.time_tracking import TimeEntry
from app.models.user import User
from app.repositories.goal_repo import get_goal, list_goals
from app.schemas.goal_schema import GoalCreate, GoalUpdate


def _week_bounds() -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    return start, start + timedelta(days=7)


def _progress(db: Session, user_id: int, goal_type: str, start: datetime, end: datetime) -> int:
    if goal_type == "tasks":
        return int(db.scalar(select(func.count(Task.id)).where(Task.user_id == user_id, Task.completed_at >= start, Task.completed_at < end)) or 0)
    if goal_type == "focus_minutes":
        seconds = db.scalar(select(func.coalesce(func.sum(FocusSession.elapsed_seconds), 0)).where(FocusSession.user_id == user_id, FocusSession.status == "completed", FocusSession.completed_at >= start, FocusSession.completed_at < end)) or 0
        return int(seconds // 60)
    if goal_type == "habit_completions":
        return int(db.scalar(select(func.count(HabitCompletion.id)).where(HabitCompletion.user_id == user_id, HabitCompletion.completion_date >= start.date(), HabitCompletion.completion_date < end.date())) or 0)
    seconds = db.scalar(select(func.coalesce(func.sum(TimeEntry.duration_seconds), 0)).where(TimeEntry.user_id == user_id, TimeEntry.started_at >= start, TimeEntry.started_at < end)) or 0
    return int(seconds // 60)


def _display(value: int, goal_type: str) -> str:
    if goal_type in {"focus_minutes", "tracked_minutes"}:
        hours, minutes = divmod(value, 60)
        return f"{hours}h {minutes}m" if hours else f"{minutes}m"
    return str(value)


def get_workspace(db: Session, user: User) -> dict:
    start, end = _week_bounds()
    items = []
    for goal in list_goals(db, user.id):
        current = _progress(db, user.id, goal.goal_type, start, end)
        percentage = min(100, round(current / goal.target_value * 100))
        items.append({**goal.__dict__, "current_value": current, "percentage": percentage, "remaining_value": max(0, goal.target_value - current), "is_complete": current >= goal.target_value, "display_current": _display(current, goal.goal_type), "display_target": _display(goal.target_value, goal.goal_type)})
    active = [item for item in items if item["is_active"]]
    completed = sum(1 for item in active if item["is_complete"])
    average = round(sum(item["percentage"] for item in active) / len(active)) if active else 0
    if not active:
        suggestion = "Create one realistic weekly target to turn your activity into a clear outcome."
    elif completed == len(active):
        suggestion = "All active goals are complete. Protect the progress instead of increasing every target immediately."
    else:
        weakest = min(active, key=lambda item: item["percentage"])
        suggestion = f"{weakest['title']} is furthest behind. Schedule one small action for it before adding more work."
    return {"summary": {"total_goals": len(active), "completed_goals": completed, "average_progress": average, "week_start": start.date(), "week_end": (end - timedelta(days=1)).date()}, "goals": items, "suggestion": suggestion}


def create_goal(db: Session, user: User, data: GoalCreate) -> ProductivityGoal:
    goal = ProductivityGoal(user_id=user.id, title=data.title.strip(), goal_type=data.goal_type, target_value=data.target_value, color=data.color)
    db.add(goal); db.commit(); db.refresh(goal); return goal


def update_goal(db: Session, user: User, goal_id: int, data: GoalUpdate) -> ProductivityGoal:
    goal = get_goal(db, user.id, goal_id)
    if goal is None: raise HTTPException(status_code=404, detail="Goal not found")
    values = data.model_dump(exclude_unset=True)
    if "title" in values: values["title"] = values["title"].strip()
    for field, value in values.items(): setattr(goal, field, value)
    db.commit(); db.refresh(goal); return goal


def delete_goal(db: Session, user: User, goal_id: int) -> None:
    goal = get_goal(db, user.id, goal_id)
    if goal is None: raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal); db.commit()
