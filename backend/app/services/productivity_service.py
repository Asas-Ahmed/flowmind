from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.focus_session import FocusSession
from app.models.habit import Habit, HabitCompletion
from app.models.task import Task
from app.models.user import User
from app.models.user_profile import UserProfile
from app.models.productivity_score import ProductivityScore


def _day_bounds(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time.min, tzinfo=timezone.utc)
    return start, start + timedelta(days=1)


def _clamp(value: float) -> int:
    return max(0, min(100, round(value)))


def _is_habit_due(habit: Habit, target: date) -> bool:
    if habit.start_date > target or (habit.end_date and habit.end_date < target):
        return False
    if habit.frequency == "daily":
        return True
    if habit.frequency == "weekdays":
        return target.weekday() < 5
    if habit.frequency in {"weekly", "custom"}:
        return target.weekday() in (habit.scheduled_days or [])
    return True


def _level(score: int) -> str:
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Strong"
    if score >= 50:
        return "Building"
    if score >= 25:
        return "Low"
    return "Getting started"


def _daily_metrics(
    day: date,
    tasks: list[Task],
    habits: list[Habit],
    completions: dict[tuple[int, date], int],
    sessions: list[FocusSession],
    focus_goal: int,
) -> dict:
    start, end = _day_bounds(day)

    relevant_tasks = [
        task
        for task in tasks
        if (task.due_at and start <= task.due_at < end)
        or (start <= task.created_at < end)
    ]
    completed_tasks = [
        task
        for task in tasks
        if task.completed_at and start <= task.completed_at < end
    ]
    overdue_tasks = [
        task
        for task in tasks
        if task.due_at and task.due_at < start and task.status != "completed"
    ]

    due_habits = [habit for habit in habits if _is_habit_due(habit, day)]
    completed_habits = [
        habit
        for habit in due_habits
        if completions.get((habit.id, day), 0) >= habit.target_count
    ]

    focus_minutes = sum(
        session.elapsed_seconds
        for session in sessions
        if session.mode == "focus"
        and session.status == "completed"
        and start <= session.started_at < end
    ) // 60

    task_score = _clamp(
        (len(completed_tasks) / max(1, len(relevant_tasks))) * 100
    )
    habit_score = _clamp(
        (len(completed_habits) / max(1, len(due_habits))) * 100
    )
    focus_score = _clamp((focus_minutes / max(1, focus_goal)) * 100)
    overdue_penalty = min(20, len(overdue_tasks) * 4)
    score = _clamp(
        task_score * 0.40
        + habit_score * 0.30
        + focus_score * 0.30
        - overdue_penalty
    )

    return {
        "score": score,
        "task_score": task_score,
        "habit_score": habit_score,
        "focus_score": focus_score,
        "completed_tasks": len(completed_tasks),
        "relevant_tasks": len(relevant_tasks),
        "completed_habits": len(completed_habits),
        "due_habits": len(due_habits),
        "focus_minutes": focus_minutes,
        "overdue_tasks": len(overdue_tasks),
        "overdue_penalty": overdue_penalty,
    }


def _save_daily_score(
    db: Session,
    user_id: int,
    score_date: date,
    metrics: dict,
) -> ProductivityScore:
    record = db.scalar(
        select(ProductivityScore).where(
            ProductivityScore.user_id == user_id,
            ProductivityScore.score_date == score_date,
        )
    )
    if record is None:
        record = ProductivityScore(user_id=user_id, score_date=score_date)
        db.add(record)

    record.score = metrics["score"]
    record.task_score = metrics["task_score"]
    record.habit_score = metrics["habit_score"]
    record.focus_score = metrics["focus_score"]
    record.overdue_penalty = metrics["overdue_penalty"]
    record.level = _level(metrics["score"])
    record.metrics = {
        "completed_tasks": metrics["completed_tasks"],
        "relevant_tasks": metrics["relevant_tasks"],
        "completed_habits": metrics["completed_habits"],
        "due_habits": metrics["due_habits"],
        "focus_minutes": metrics["focus_minutes"],
        "overdue_tasks": metrics["overdue_tasks"],
    }
    record.calculated_at = datetime.now(timezone.utc)
    return record


def _stored_trend_point(record: ProductivityScore) -> dict:
    metrics = record.metrics or {}
    return {
        "date": record.score_date,
        "day": record.score_date.strftime("%a"),
        "score": record.score,
        "tasks": int(metrics.get("completed_tasks", 0)),
        "habits": int(metrics.get("completed_habits", 0)),
        "focus_minutes": int(metrics.get("focus_minutes", 0)),
        "overdue_penalty": record.overdue_penalty,
    }


def get_productivity(db: Session, user: User) -> dict:
    today = date.today()
    history_start = today - timedelta(days=29)
    history_start_dt, _ = _day_bounds(history_start)
    _, tomorrow_dt = _day_bounds(today)

    tasks = list(db.scalars(select(Task).where(Task.user_id == user.id)).all())
    habits = list(
        db.scalars(
            select(Habit).where(
                Habit.user_id == user.id,
                Habit.is_archived.is_(False),
            )
        ).all()
    )
    habit_completions = list(
        db.scalars(
            select(HabitCompletion).where(
                HabitCompletion.user_id == user.id,
                HabitCompletion.completion_date >= history_start,
                HabitCompletion.completion_date <= today,
            )
        ).all()
    )
    sessions = list(
        db.scalars(
            select(FocusSession).where(
                FocusSession.user_id == user.id,
                FocusSession.started_at >= history_start_dt,
                FocusSession.started_at < tomorrow_dt,
            )
        ).all()
    )
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    focus_goal = profile.daily_focus_goal_minutes if profile else 120

    completion_map = {
        (completion.habit_id, completion.completion_date): completion.count
        for completion in habit_completions
    }

    trend = []
    active_days = 0
    for offset in range(30):
        day = history_start + timedelta(days=offset)
        metrics = _daily_metrics(
            day,
            tasks,
            habits,
            completion_map,
            sessions,
            focus_goal,
        )
        if (
            metrics["completed_tasks"]
            or metrics["completed_habits"]
            or metrics["focus_minutes"]
        ):
            active_days += 1
        record = _save_daily_score(db, user.id, day, metrics)
        trend.append(_stored_trend_point(record))

    today_metrics = _daily_metrics(
        today,
        tasks,
        habits,
        completion_map,
        sessions,
        focus_goal,
    )
    previous_metrics = _daily_metrics(
        today - timedelta(days=1),
        tasks,
        habits,
        completion_map,
        sessions,
        focus_goal,
    )

    db.commit()

    score = today_metrics["score"]
    level = _level(score)

    components = [
        {
            "key": "tasks",
            "label": "Task completion",
            "score": today_metrics["task_score"],
            "weight": 40,
            "weighted_points": round(today_metrics["task_score"] * 0.40, 1),
            "current": today_metrics["completed_tasks"],
            "target": today_metrics["relevant_tasks"],
            "unit": "tasks",
            "explanation": "Completed tasks compared with tasks created or due today.",
            "action_label": "Open tasks",
            "action_href": "/tasks",
        },
        {
            "key": "habits",
            "label": "Habit consistency",
            "score": today_metrics["habit_score"],
            "weight": 30,
            "weighted_points": round(today_metrics["habit_score"] * 0.30, 1),
            "current": today_metrics["completed_habits"],
            "target": today_metrics["due_habits"],
            "unit": "habits",
            "explanation": "Scheduled habits completed against today’s habit targets.",
            "action_label": "Open habits",
            "action_href": "/habits",
        },
        {
            "key": "focus",
            "label": "Focus goal",
            "score": today_metrics["focus_score"],
            "weight": 30,
            "weighted_points": round(today_metrics["focus_score"] * 0.30, 1),
            "current": today_metrics["focus_minutes"],
            "target": focus_goal,
            "unit": "minutes",
            "explanation": "Completed deep-work minutes compared with your daily focus goal.",
            "action_label": "Start focus",
            "action_href": "/focus",
        },
    ]

    recommendations = []
    if today_metrics["overdue_tasks"]:
        recommendations.append(
            {
                "title": "Reduce overdue pressure",
                "message": f"{today_metrics['overdue_tasks']} overdue task{'s are' if today_metrics['overdue_tasks'] != 1 else ' is'} reducing today’s score by {today_metrics['overdue_penalty']} points.",
                "priority": "high",
                "action_label": "Review backlog",
                "action_href": "/tasks",
            }
        )
    if today_metrics["focus_score"] < 70:
        remaining = max(0, focus_goal - today_metrics["focus_minutes"])
        recommendations.append(
            {
                "title": "Add one focused block",
                "message": f"Complete another {remaining} focus minute{'s' if remaining != 1 else ''} to reach your daily goal.",
                "priority": "medium",
                "action_label": "Start focus session",
                "action_href": "/focus",
            }
        )
    if today_metrics["habit_score"] < 100 and today_metrics["due_habits"]:
        remaining = today_metrics["due_habits"] - today_metrics["completed_habits"]
        recommendations.append(
            {
                "title": "Protect your habit consistency",
                "message": f"Complete {remaining} remaining habit{'s' if remaining != 1 else ''} to strengthen today’s consistency score.",
                "priority": "medium",
                "action_label": "Check habits",
                "action_href": "/habits",
            }
        )
    if today_metrics["task_score"] < 100:
        recommendations.append(
            {
                "title": "Finish a meaningful next action",
                "message": "Completing one relevant task can improve the strongest weighted part of your score.",
                "priority": "low",
                "action_label": "Choose a task",
                "action_href": "/tasks",
            }
        )
    if not recommendations:
        recommendations.append(
            {
                "title": "Maintain your balance",
                "message": "Your task, habit, and focus activity are currently balanced. Keep the next action small and intentional.",
                "priority": "positive",
                "action_label": "View dashboard",
                "action_href": "/dashboard",
            }
        )

    if active_days >= 20:
        confidence = "High"
    elif active_days >= 7:
        confidence = "Medium"
    else:
        confidence = "Early"

    summary = (
        f"Your score is {level.lower()} today. It combines task completion, "
        "habit consistency, focus progress, and an overdue-work penalty."
    )

    return {
        "generated_at": datetime.now(timezone.utc),
        "score": score,
        "previous_score": previous_metrics["score"],
        "score_change": score - previous_metrics["score"],
        "level": level,
        "summary": summary,
        "data_confidence": confidence,
        "active_days": active_days,
        "overdue_tasks": today_metrics["overdue_tasks"],
        "overdue_penalty": today_metrics["overdue_penalty"],
        "components": components,
        "trend": trend,
        "recommendations": recommendations[:4],
    }
