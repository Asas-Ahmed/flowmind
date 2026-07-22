from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from math import cos, pi, sin
from statistics import mean

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.ai.task_risk.explainer import explain_prediction
from app.ai.task_risk.predictor import TaskRiskPredictor
from app.models.cognitive_load import CognitiveLoadEntry
from app.models.distraction_log import DistractionLog
from app.models.energy_checkin import EnergyCheckIn
from app.models.focus_session import FocusSession
from app.models.goal import ProductivityGoal
from app.models.habit import Habit, HabitCompletion
from app.models.life_balance import LifeBalanceCheckIn
from app.models.movement_break import MovementBreak
from app.models.recovery_break import RecoveryBreak
from app.models.sleep_record import SleepRecord
from app.models.task import Task, TaskCategory
from app.models.time_tracking import WorkCategory
from app.schemas.task_risk_schema import TaskRiskPrediction, TaskRiskWorkspace


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _ratio(numerator: float, denominator: float, default: float = 0.5) -> float:
    return numerator / denominator if denominator else default


def _task_priority(task: Task) -> str:
    return {
        "urgent_important": "high",
        "important_not_urgent": "medium",
        "urgent_not_important": "medium",
        "not_urgent_not_important": "low",
    }.get(task.eisenhower, "medium")


def _time_block(value: datetime) -> str:
    if value.hour < 6: return "night"
    if value.hour < 12: return "morning"
    if value.hour < 17: return "afternoon"
    if value.hour < 21: return "evening"
    return "night"


def _complexity(task: Task) -> int:
    text = f"{task.title} {task.description or ''}".lower()
    score = 2
    if task.eisenhower == "urgent_important": score += 1
    if len(text) > 240: score += 1
    if len(task.subtasks or []) >= 5: score += 1
    return int(_clamp(score, 1, 5))


def _history_rate(tasks: list[Task], subset: list[Task] | None = None) -> float:
    rows = subset if subset is not None else tasks
    resolved = [task for task in rows if task.status == "completed" or (task.due_at and task.due_at < datetime.now(timezone.utc))]
    if not resolved: return 0.67
    return _ratio(sum(task.status == "completed" for task in resolved), len(resolved), 0.67)


def _build_context(db: Session, user_id: int) -> dict:
    now = datetime.now(timezone.utc)
    since_7 = now - timedelta(days=7)
    since_30 = now - timedelta(days=30)
    tasks = list(db.scalars(select(Task).where(Task.user_id == user_id).order_by(Task.created_at)).all())
    open_tasks = [task for task in tasks if task.status != "completed"]
    overdue = [task for task in open_tasks if task.due_at and task.due_at < now]
    recent_tasks = [task for task in tasks if task.created_at >= since_30]
    recent7 = [task for task in tasks if task.created_at >= since_7]

    focus_rows = list(db.scalars(select(FocusSession).where(FocusSession.user_id == user_id, FocusSession.started_at >= since_7)).all())
    completed_focus = [row for row in focus_rows if row.status == "completed"]
    focus_minutes = sum(row.elapsed_seconds for row in completed_focus) / 60
    focus_consistency = _clamp(len({row.started_at.date() for row in completed_focus}) / 7, 0, 1)

    habits = list(db.scalars(select(Habit).where(Habit.user_id == user_id, Habit.is_archived.is_(False))).all())
    habit_completions = list(db.scalars(select(HabitCompletion).where(HabitCompletion.user_id == user_id, HabitCompletion.completion_date >= since_7.date())).all())
    habit_rate = _clamp(_ratio(len(habit_completions), max(len(habits) * 7, 1), 0.5), 0, 1)
    streak_days = len({row.completion_date for row in habit_completions})

    energy = db.scalar(select(EnergyCheckIn).where(EnergyCheckIn.user_id == user_id).order_by(EnergyCheckIn.checked_at.desc()).limit(1))
    sleep = db.scalar(select(SleepRecord).where(SleepRecord.user_id == user_id).order_by(SleepRecord.sleep_date.desc()).limit(1))
    cognitive_rows = list(db.scalars(select(CognitiveLoadEntry).where(CognitiveLoadEntry.user_id == user_id, CognitiveLoadEntry.entry_date >= since_7.date())).all())
    cognitive_map = {"low": 1, "medium": 3, "high": 5}
    cognitive = mean([cognitive_map.get(row.difficulty, 3) for row in cognitive_rows]) if cognitive_rows else 3
    distractions = db.scalar(select(func.count(DistractionLog.id)).where(DistractionLog.user_id == user_id, DistractionLog.occurred_at >= since_7)) or 0
    movement = db.scalar(select(func.count(MovementBreak.id)).where(MovementBreak.user_id == user_id, MovementBreak.completed_at >= since_7, MovementBreak.status == "completed")) or 0
    recovery = db.scalar(select(func.count(RecoveryBreak.id)).where(RecoveryBreak.user_id == user_id, RecoveryBreak.completed_at >= since_7)) or 0
    balance_rows = list(db.scalars(select(LifeBalanceCheckIn).where(LifeBalanceCheckIn.user_id == user_id, LifeBalanceCheckIn.checkin_date >= since_30.date())).all())
    balance = mean([row.score for row in balance_rows]) if balance_rows else 6.5
    goals = list(db.scalars(select(ProductivityGoal).where(ProductivityGoal.user_id == user_id, ProductivityGoal.is_active.is_(True))).all())
    goal_progress = _clamp(_ratio(sum(task.status == "completed" for task in recent7), sum(goal.target_value for goal in goals), 0.5), 0, 1)

    productivity = _clamp((0.45 * _history_rate(tasks, recent_tasks) + 0.25 * focus_consistency + 0.2 * habit_rate + 0.1 * _clamp(balance / 10, 0, 1)) * 100, 0, 100)
    return {
        "tasks": tasks, "open": open_tasks, "overdue": overdue,
        "recent_productivity_score": productivity,
        "recent_focus_minutes": focus_minutes,
        "focus_consistency": focus_consistency,
        "habit_completion_rate": habit_rate,
        "habit_streak_days": streak_days,
        "distraction_frequency": int(distractions),
        "sleep_hours": float(sleep.duration_hours if sleep else 7.0),
        "energy_level": int(energy.energy_level if energy else 3),
        "stress_level": int(energy.stress_level if energy else 3),
        "cognitive_load": float(cognitive),
        "movement_breaks": int(movement),
        "recovery_breaks": int(recovery),
        "life_balance_score": float(balance),
        "goal_progress": float(goal_progress),
        "recent_7_task_completion_rate": _history_rate(tasks, recent7),
        "historical_completion_rate": _history_rate(tasks),
    }


def _features(db: Session, task: Task, context: dict) -> dict:
    now = datetime.now(timezone.utc)
    target_date = task.due_at or task.start_at or now + timedelta(days=7)
    if target_date.tzinfo is None: target_date = target_date.replace(tzinfo=timezone.utc)
    category = db.get(TaskCategory, task.category_id) if task.category_id else None
    category_name = (category.name if category else "general").strip().lower().replace(" ", "_")
    task_index = next((index for index, row in enumerate(context["tasks"], 1) if row.id == task.id), len(context["tasks"]) + 1)
    same_priority = [row for row in context["tasks"] if row.eisenhower == task.eisenhower and row.id != task.id]
    same_category = [row for row in context["tasks"] if row.category_id == task.category_id and row.id != task.id]
    due_pressure = [row for row in context["tasks"] if row.due_at and (row.due_at - row.created_at).total_seconds() <= 72 * 3600 and row.id != task.id]
    current_block = _time_block(now)
    same_block = [row for row in context["tasks"] if _time_block(row.created_at) == current_block and row.id != task.id]
    estimated = max(15, len(task.subtasks or []) * 20 or 30)
    if task.description: estimated += min(90, len(task.description) // 20 * 5)
    if task.eisenhower == "urgent_important": estimated += 30
    day_of_year = target_date.timetuple().tm_yday
    week = target_date.isocalendar().week

    return {
        "task_sequence": task_index,
        "priority": _task_priority(task),
        "category": category_name,
        "time_block": _time_block(target_date),
        "preferred_time_block": current_block,
        "estimated_duration_minutes": estimated,
        "remaining_hours": max(0.0, (target_date - now).total_seconds() / 3600),
        "reschedule_count": 1 if task.repeat_rule != "none" else 0,
        "task_complexity": _complexity(task),
        "recent_productivity_score": context["recent_productivity_score"],
        "current_workload": len(context["open"]),
        "overdue_task_count": len(context["overdue"]),
        "time_budget_usage": _clamp(len(context["open"]) / 10, 0, 1.5),
        "goal_progress": context["goal_progress"],
        "recent_focus_minutes": context["recent_focus_minutes"],
        "focus_consistency": context["focus_consistency"],
        "habit_completion_rate": context["habit_completion_rate"],
        "habit_streak_days": context["habit_streak_days"],
        "distraction_frequency": context["distraction_frequency"],
        "sleep_hours": context["sleep_hours"],
        "energy_level": context["energy_level"],
        "stress_level": context["stress_level"],
        "cognitive_load": context["cognitive_load"],
        "movement_breaks": context["movement_breaks"],
        "recovery_breaks": context["recovery_breaks"],
        "life_balance_score": context["life_balance_score"],
        "day_of_week": target_date.weekday(),
        "is_weekend": int(target_date.weekday() >= 5),
        "historical_completion_rate": context["historical_completion_rate"],
        "recent_7_task_completion_rate": context["recent_7_task_completion_rate"],
        "priority_completion_rate": _history_rate(context["tasks"], same_priority),
        "category_completion_rate": _history_rate(context["tasks"], same_category),
        "deadline_pressure_success_rate": _history_rate(context["tasks"], due_pressure),
        "time_block_completion_rate": _history_rate(context["tasks"], same_block),
        "task_month": target_date.month,
        "task_day": target_date.day,
        "task_dayofyear": day_of_year,
        "task_weekofyear": week,
        "month_sin": sin(2 * pi * target_date.month / 12),
        "month_cos": cos(2 * pi * target_date.month / 12),
        "dayofyear_sin": sin(2 * pi * day_of_year / 365.25),
        "dayofyear_cos": cos(2 * pi * day_of_year / 365.25),
    }


def predict_task(db: Session, user_id: int, task_id: int, context: dict | None = None) -> TaskRiskPrediction:
    task = db.scalar(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    feature_values = _features(db, task, context or _build_context(db, user_id))
    prediction = TaskRiskPredictor().predict(feature_values)
    reasons, action = explain_prediction(feature_values, prediction.risk_level)
    return TaskRiskPrediction(
        task_id=task.id,
        completion_probability=round(prediction.completion_probability, 4),
        risk_probability=round(prediction.risk_probability, 4),
        risk_level=prediction.risk_level,
        important_factors=reasons,
        recommended_action=action,
        model_version=prediction.model_version,
        completion_threshold=round(prediction.threshold, 4),
    )


def predict_open_tasks(db: Session, user_id: int) -> TaskRiskWorkspace:
    context = _build_context(db, user_id)
    open_tasks = [task for task in context["open"] if task.status != "completed"]
    predictions = [predict_task(db, user_id, task.id, context) for task in open_tasks]
    predictions.sort(key=lambda row: row.risk_probability, reverse=True)
    return TaskRiskWorkspace(
        predictions=predictions,
        high_risk_count=sum(row.risk_level == "high" for row in predictions),
        medium_risk_count=sum(row.risk_level == "medium" for row in predictions),
        low_risk_count=sum(row.risk_level == "low" for row in predictions),
        model_version=TaskRiskPredictor.MODEL_VERSION,
    )
