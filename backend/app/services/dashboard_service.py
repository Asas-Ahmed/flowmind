from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.focus_session import FocusSession
from app.models.habit import Habit, HabitCompletion
from app.models.schedule_event import ScheduleEvent
from app.models.task import Task
from app.models.user import User
from app.models.user_profile import UserProfile
from app.services.productivity_service import get_productivity


def _day_bounds(day: date) -> tuple[datetime, datetime]:
    start = datetime.combine(day, time.min, tzinfo=timezone.utc)
    return start, start + timedelta(days=1)


def _as_utc(value: datetime | None) -> datetime | None:
    """Normalize database datetimes for safe Python-side UTC comparisons.

    PostgreSQL preserves timezone information for DateTime(timezone=True), while
    SQLite may return the same stored value without tzinfo. Treat naive values as
    UTC because FlowMind stores application datetimes in UTC.
    """
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


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


def _clamp(value: float) -> int:
    return max(0, min(100, round(value)))


def get_dashboard(db: Session, user: User) -> dict:
    today = date.today()
    today_start, tomorrow_start = _day_bounds(today)
    week_start = today - timedelta(days=6)
    week_start_dt, _ = _day_bounds(week_start)
    _, week_end_dt = _day_bounds(today)

    tasks = list(db.scalars(select(Task).where(Task.user_id == user.id)).all())
    habits = list(
        db.scalars(
            select(Habit).where(Habit.user_id == user.id, Habit.is_archived.is_(False))
        ).all()
    )
    completions = list(
        db.scalars(
            select(HabitCompletion).where(
                HabitCompletion.user_id == user.id,
                HabitCompletion.completion_date >= week_start,
                HabitCompletion.completion_date <= today,
            )
        ).all()
    )
    sessions = list(
        db.scalars(
            select(FocusSession).where(
                FocusSession.user_id == user.id,
                FocusSession.started_at >= week_start_dt,
                FocusSession.started_at < week_end_dt,
            )
        ).all()
    )
    events = list(
        db.scalars(
            select(ScheduleEvent)
            .where(
                ScheduleEvent.user_id == user.id,
                ScheduleEvent.start_at >= today_start,
                ScheduleEvent.start_at < today_start + timedelta(days=7),
            )
            .order_by(ScheduleEvent.start_at.asc())
        ).all()
    )
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    focus_goal = profile.daily_focus_goal_minutes if profile else 120

    active_tasks = [task for task in tasks if task.status != "completed"]
    active_habits = habits
    due_today = [
        task
        for task in active_tasks
        if (due_at := _as_utc(task.due_at)) and today_start <= due_at < tomorrow_start
    ]
    overdue = [
        task
        for task in tasks
        if (due_at := _as_utc(task.due_at))
        and due_at < today_start
        and task.status != "completed"
    ]
    completed_today = [
        task
        for task in tasks
        if (completed_at := _as_utc(task.completed_at))
        and today_start <= completed_at < tomorrow_start
    ]
    created_or_due_today = [
        task
        for task in tasks
        if (
            ((due_at := _as_utc(task.due_at)) and today_start <= due_at < tomorrow_start)
            or (
                (created_at := _as_utc(task.created_at))
                and today_start <= created_at < tomorrow_start
            )
        )
    ]

    today_focus = sum(
        session.elapsed_seconds
        for session in sessions
        if session.mode == "focus"
        and session.status == "completed"
        and (started_at := _as_utc(session.started_at))
        and today_start <= started_at < tomorrow_start
    ) // 60

    completion_by_habit_date = {(item.habit_id, item.completion_date): item.count for item in completions}
    due_habits = [habit for habit in habits if _is_habit_due(habit, today)]
    completed_habits = [habit for habit in due_habits if completion_by_habit_date.get((habit.id, today), 0) >= habit.target_count]

    productivity = get_productivity(db, user)
    productivity_score = productivity["score"]
    score_change = productivity["score_change"]
    component_scores = {item["key"]: item["score"] for item in productivity["components"]}
    task_rate = component_scores.get("tasks", 0)
    habit_rate = component_scores.get("habits", 0)
    focus_rate = component_scores.get("focus", 0)
    shared_trend = {item["date"]: item for item in productivity["trend"]}

    trend = []
    for offset in range(7):
        day = week_start + timedelta(days=offset)
        start, end = _day_bounds(day)
        day_tasks = [
            task
            for task in tasks
            if (completed_at := _as_utc(task.completed_at)) and start <= completed_at < end
        ]
        day_focus = sum(
            session.elapsed_seconds
            for session in sessions
            if session.mode == "focus"
            and session.status == "completed"
            and (started_at := _as_utc(session.started_at))
            and start <= started_at < end
        ) // 60
        day_due_habits = [habit for habit in habits if _is_habit_due(habit, day)]
        day_habits = sum(
            1
            for habit in day_due_habits
            if completion_by_habit_date.get((habit.id, day), 0) >= habit.target_count
        )
        score = shared_trend.get(day, {}).get("score", 0)
        trend.append({
            "date": day,
            "day": day.strftime("%a"),
            "score": score,
            "tasks_completed": len(day_tasks),
            "focus_minutes": day_focus,
            "habits_completed": day_habits,
        })


    priority_order = {"urgent_important": 0, "important_not_urgent": 1, "urgent_not_important": 2, "not_urgent_not_important": 3}
    priority_tasks = sorted(
        [task for task in tasks if task.status != "completed"],
        key=lambda task: (
            priority_order.get(task.eisenhower, 9),
            _as_utc(task.due_at) or datetime.max.replace(tzinfo=timezone.utc),
        ),
    )[:5]

    habit_items = []
    for habit in due_habits[:5]:
        count = completion_by_habit_date.get((habit.id, today), 0)
        habit_items.append({
            "id": habit.id,
            "name": habit.name,
            "color": habit.color,
            "completed_today": count >= habit.target_count,
            "progress": _clamp((count / max(1, habit.target_count)) * 100),
        })

    if overdue:
        insight = {"title": "Protect today from backlog", "message": f"You have {len(overdue)} overdue task{'s' if len(overdue) != 1 else ''}. Clear the most important one before adding more work.", "tone": "warning", "action_label": "Review tasks", "action_href": "/tasks"}
    elif focus_rate < 50:
        insight = {"title": "A focus block will lift your score", "message": f"You have logged {today_focus} of {focus_goal} focus minutes today. Start one focused session next.", "tone": "focus", "action_label": "Start focus", "action_href": "/focus"}
    elif habit_rate < 100 and due_habits:
        insight = {"title": "Keep your habit momentum", "message": f"{len(due_habits) - len(completed_habits)} habit{'s' if len(due_habits) - len(completed_habits) != 1 else ''} still need attention today.", "tone": "habit", "action_label": "Open habits", "action_href": "/habits"}
    else:
        insight = {"title": "Strong daily balance", "message": "Your tasks, habits, and focus activity are balanced. Keep the next action small and intentional.", "tone": "positive", "action_label": "View schedule", "action_href": "/schedule"}

    return {
        "user_name": user.full_name,
        "generated_at": datetime.now(timezone.utc),
        "productivity_score": productivity_score,
        "score_change": score_change,
        "active_tasks": len(active_tasks),
        "active_habits": len(active_habits),
        "tasks_due_today": len(due_today),
        "overdue_tasks": len(overdue),
        "completed_today": len(completed_today),
        "focus_minutes_today": today_focus,
        "focus_goal_minutes": focus_goal,
        "habits_completed_today": len(completed_habits),
        "habits_due_today": len(due_habits),
        "upcoming_count": len(events),
        "task_completion_rate": task_rate,
        "habit_completion_rate": habit_rate,
        "focus_goal_rate": focus_rate,
        "priority_tasks": priority_tasks,
        "habits": habit_items,
        "upcoming_schedule": events[:5],
        "weekly_trend": trend,
        "insight": insight,
    }
