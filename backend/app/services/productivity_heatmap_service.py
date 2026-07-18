from collections import Counter, defaultdict
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.energy_checkin import EnergyCheckIn
from app.models.focus_session import FocusSession
from app.models.habit import HabitCompletion
from app.models.sleep_record import SleepRecord
from app.models.task import Task
from app.models.user import User


def _utc_start(day: date) -> datetime:
    return datetime.combine(day, time.min, tzinfo=timezone.utc)


def _score(tasks: int, focus_minutes: int, habits: int, energy: float | None, sleep_hours: float | None, sleep_quality: int | None) -> int:
    task_points = min(30, tasks * 8)
    focus_points = min(35, round((focus_minutes / 120) * 35))
    habit_points = min(20, habits * 5)
    wellbeing_points = 0
    if energy is not None:
        wellbeing_points += round((energy / 5) * 7)
    if sleep_hours is not None:
        wellbeing_points += round(max(0, 1 - abs(sleep_hours - 7.5) / 4) * 5)
    if sleep_quality is not None:
        wellbeing_points += round((sleep_quality / 5) * 3)
    return max(0, min(100, task_points + focus_points + habit_points + wellbeing_points))


def _level(score: int) -> int:
    if score <= 0:
        return 0
    if score < 25:
        return 1
    if score < 50:
        return 2
    if score < 75:
        return 3
    return 4


def _streaks(days: list[dict]) -> tuple[int, int]:
    longest = 0
    running = 0
    for item in days:
        if item["score"] > 0:
            running += 1
            longest = max(longest, running)
        else:
            running = 0

    current = 0
    today = datetime.now(timezone.utc).date()
    relevant = [item for item in days if item["date"] <= today]
    for item in reversed(relevant):
        if item["score"] <= 0:
            break
        current += 1
    return current, longest


def get_productivity_heatmap(db: Session, user: User, year: int | None = None):
    today = datetime.now(timezone.utc).date()
    selected_year = year or today.year
    start = date(selected_year, 1, 1)
    end = date(selected_year + 1, 1, 1)
    start_dt = _utc_start(start)
    end_dt = _utc_start(end)

    tasks = db.scalars(select(Task).where(Task.user_id == user.id, Task.completed_at >= start_dt, Task.completed_at < end_dt)).all()
    sessions = db.scalars(select(FocusSession).where(FocusSession.user_id == user.id, FocusSession.status == "completed", FocusSession.started_at >= start_dt, FocusSession.started_at < end_dt)).all()
    habits = db.scalars(select(HabitCompletion).where(HabitCompletion.user_id == user.id, HabitCompletion.completion_date >= start, HabitCompletion.completion_date < end)).all()
    energy = db.scalars(select(EnergyCheckIn).where(EnergyCheckIn.user_id == user.id, EnergyCheckIn.checked_at >= start_dt, EnergyCheckIn.checked_at < end_dt)).all()
    sleep = db.scalars(select(SleepRecord).where(SleepRecord.user_id == user.id, SleepRecord.sleep_date >= start, SleepRecord.sleep_date < end)).all()

    task_counts = Counter(item.completed_at.date() for item in tasks if item.completed_at)
    focus_minutes: Counter[date] = Counter()
    for item in sessions:
        if item.mode == "focus":
            focus_minutes[item.started_at.date()] += max(0, round(item.elapsed_seconds / 60))
    habit_counts = Counter(item.completion_date for item in habits)

    energy_values: dict[date, list[int]] = defaultdict(list)
    for item in energy:
        energy_values[item.checked_at.date()].append(item.energy_level)
    sleep_values = {item.sleep_date: item for item in sleep}

    days = []
    cursor = start
    while cursor < end:
        energy_average = round(sum(energy_values[cursor]) / len(energy_values[cursor]), 1) if energy_values[cursor] else None
        sleep_record = sleep_values.get(cursor)
        score = _score(
            task_counts[cursor],
            focus_minutes[cursor],
            habit_counts[cursor],
            energy_average,
            sleep_record.duration_hours if sleep_record else None,
            sleep_record.quality if sleep_record else None,
        )
        days.append({
            "date": cursor,
            "score": score,
            "level": _level(score),
            "tasks_completed": task_counts[cursor],
            "focus_minutes": focus_minutes[cursor],
            "habit_completions": habit_counts[cursor],
            "energy_average": energy_average,
            "sleep_hours": round(sleep_record.duration_hours, 1) if sleep_record else None,
            "sleep_quality": sleep_record.quality if sleep_record else None,
        })
        cursor += timedelta(days=1)

    active = [item for item in days if item["score"] > 0]
    best = max(active, key=lambda item: item["score"], default=None)
    current_streak, longest_streak = _streaks(days)
    average_score = round(sum(item["score"] for item in active) / len(active)) if active else 0

    years = {today.year, selected_year}
    for model, field in ((Task, Task.completed_at), (FocusSession, FocusSession.started_at), (EnergyCheckIn, EnergyCheckIn.checked_at)):
        values = db.scalars(select(field).where(model.user_id == user.id, field.is_not(None))).all()
        years.update(value.year for value in values if value)
    years.update(item.completion_date.year for item in db.scalars(select(HabitCompletion).where(HabitCompletion.user_id == user.id)).all())
    years.update(item.sleep_date.year for item in db.scalars(select(SleepRecord).where(SleepRecord.user_id == user.id)).all())

    if not active:
        insight = {"title": "Your productivity map is ready", "message": "Complete a task, focus session, or habit to create the first contribution square."}
    elif current_streak >= 5:
        insight = {"title": "Consistency is your strongest signal", "message": f"You have an active {current_streak}-day productivity streak. Protect the routine rather than chasing a perfect score every day."}
    else:
        insight = {"title": "Build a repeatable rhythm", "message": f"Your average active-day score is {average_score}. Small contributions across tasks, focus, habits, and wellbeing create a stronger pattern than one intense day."}

    return {
        "year": selected_year,
        "available_years": sorted(years, reverse=True),
        "days": days,
        "summary": {
            "active_days": len(active), "total_days": len(days), "average_score": average_score,
            "best_score": best["score"] if best else 0, "best_date": best["date"] if best else None,
            "current_streak": current_streak, "longest_streak": longest_streak,
            "total_tasks": sum(task_counts.values()), "total_focus_minutes": sum(focus_minutes.values()),
            "total_habits": sum(habit_counts.values()),
        },
        "insight": insight,
    }
