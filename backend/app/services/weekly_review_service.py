from collections import Counter, defaultdict
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.distraction_log import DistractionLog
from app.models.energy_checkin import EnergyCheckIn
from app.models.focus_session import FocusSession
from app.models.habit import HabitCompletion
from app.models.sleep_record import SleepRecord
from app.models.task import Task
from app.models.time_tracking import TimeEntry
from app.models.user import User


def _week_bounds(offset: int = 0):
    today = datetime.now(timezone.utc).date()
    start_date = today - timedelta(days=today.weekday()) + timedelta(weeks=offset)
    end_date = start_date + timedelta(days=6)
    start_dt = datetime.combine(start_date, time.min, tzinfo=timezone.utc)
    end_dt = datetime.combine(end_date + timedelta(days=1), time.min, tzinfo=timezone.utc)
    return start_date, end_date, start_dt, end_dt


def _percent_change(current: float, previous: float) -> float | None:
    if previous <= 0:
        return None if current <= 0 else 100.0
    return round(((current - previous) / previous) * 100, 1)


def _format_minutes(minutes: int) -> str:
    hours, remainder = divmod(max(0, minutes), 60)
    if not hours:
        return f"{remainder}m"
    return f"{hours}h {remainder}m" if remainder else f"{hours}h"


def _score(tasks: int, focus: int, habits: int, distractions: int, sleep: float | None, energy: float | None) -> int:
    task_points = min(25, tasks * 3)
    focus_points = min(25, round(focus / 24))
    habit_points = min(20, habits * 2)
    wellbeing_points = 15
    if sleep is not None:
        wellbeing_points += 7 if 7 <= sleep <= 9 else 2 if 6 <= sleep < 10 else -3
    if energy is not None:
        wellbeing_points += round((energy - 3) * 2)
    return max(0, min(100, task_points + focus_points + habit_points + wellbeing_points - min(18, distractions * 2)))


def get_weekly_review(db: Session, current_user: User, *, week_offset: int = 0):
    start_date, end_date, start_dt, end_dt = _week_bounds(week_offset)
    previous_start = start_dt - timedelta(days=7)
    user_id = current_user.id

    tasks = db.query(Task).filter(Task.user_id == user_id, Task.completed_at >= previous_start, Task.completed_at < end_dt).all()
    focus = db.query(FocusSession).filter(FocusSession.user_id == user_id, FocusSession.completed_at >= previous_start, FocusSession.completed_at < end_dt).all()
    habits = db.query(HabitCompletion).filter(HabitCompletion.user_id == user_id, HabitCompletion.completed_at >= previous_start, HabitCompletion.completed_at < end_dt).all()
    tracked = db.query(TimeEntry).filter(TimeEntry.user_id == user_id, TimeEntry.ended_at >= previous_start, TimeEntry.ended_at < end_dt).all()
    distractions = db.query(DistractionLog).filter(DistractionLog.user_id == user_id, DistractionLog.occurred_at >= start_dt, DistractionLog.occurred_at < end_dt).all()
    sleeps = db.query(SleepRecord).filter(SleepRecord.user_id == user_id, SleepRecord.sleep_date >= start_date, SleepRecord.sleep_date <= end_date).all()
    energy = db.query(EnergyCheckIn).filter(EnergyCheckIn.user_id == user_id, EnergyCheckIn.checked_at >= start_dt, EnergyCheckIn.checked_at < end_dt).all()

    def in_current(value):
        return value is not None and start_dt <= value < end_dt

    current_tasks = [item for item in tasks if in_current(item.completed_at)]
    previous_tasks = [item for item in tasks if item.completed_at and previous_start <= item.completed_at < start_dt]
    current_focus = [item for item in focus if in_current(item.completed_at)]
    previous_focus = [item for item in focus if item.completed_at and previous_start <= item.completed_at < start_dt]
    current_habits = [item for item in habits if in_current(item.completed_at)]
    previous_habits = [item for item in habits if item.completed_at and previous_start <= item.completed_at < start_dt]
    current_tracked = [item for item in tracked if in_current(item.ended_at)]
    previous_tracked = [item for item in tracked if item.ended_at and previous_start <= item.ended_at < start_dt]

    focus_minutes = round(sum(item.elapsed_seconds for item in current_focus) / 60)
    previous_focus_minutes = round(sum(item.elapsed_seconds for item in previous_focus) / 60)
    tracked_minutes = round(sum(item.duration_seconds for item in current_tracked) / 60)
    previous_tracked_minutes = round(sum(item.duration_seconds for item in previous_tracked) / 60)
    average_sleep = round(sum(item.duration_hours for item in sleeps) / len(sleeps), 1) if sleeps else None
    average_energy = round(sum(item.energy_level for item in energy) / len(energy), 1) if energy else None

    daily = defaultdict(lambda: {"tasks": 0, "focus": 0, "tracked": 0, "habits": 0})
    for item in current_tasks:
        daily[item.completed_at.date()]["tasks"] += 1
    for item in current_focus:
        daily[item.completed_at.date()]["focus"] += round(item.elapsed_seconds / 60)
    for item in current_tracked:
        daily[item.ended_at.date()]["tracked"] += round(item.duration_seconds / 60)
    for item in current_habits:
        daily[item.completed_at.date()]["habits"] += item.count

    day_rows = []
    best_day = None
    best_score = -1
    for index in range(7):
        current_date = start_date + timedelta(days=index)
        values = daily[current_date]
        day_score = min(100, values["tasks"] * 10 + round(values["focus"] / 6) + round(values["tracked"] / 12) + values["habits"] * 6)
        if day_score > best_score and day_score > 0:
            best_score = day_score
            best_day = current_date.strftime("%A")
        day_rows.append({
            "date": current_date,
            "label": current_date.strftime("%a"),
            "tasks_completed": values["tasks"],
            "focus_minutes": values["focus"],
            "tracked_minutes": values["tracked"],
            "habit_completions": values["habits"],
            "score": day_score,
        })

    productive_hours = Counter(item.started_at.hour for item in current_focus if item.started_at)
    if not productive_hours:
        productive_hours.update(item.started_at.hour for item in current_tracked if item.started_at)
    most_productive_window = None
    if productive_hours:
        hour = productive_hours.most_common(1)[0][0]
        start_label = datetime(2000, 1, 1, hour).strftime("%I %p").lstrip("0")
        end_hour = (hour + 2) % 24
        end_label = datetime(2000, 1, 1, end_hour).strftime("%I %p").lstrip("0")
        most_productive_window = f"{start_label}–{end_label}"

    distraction_counts = Counter(item.distraction_type.replace("_", " ").title() for item in distractions)
    biggest_distraction = distraction_counts.most_common(1)[0][0] if distraction_counts else None
    score = _score(len(current_tasks), focus_minutes, len(current_habits), len(distractions), average_sleep, average_energy)
    score_label = "Excellent week" if score >= 80 else "Strong momentum" if score >= 65 else "Building consistency" if score >= 45 else "Reset and simplify"

    strengths = []
    if len(current_tasks) >= 5: strengths.append(f"You completed {len(current_tasks)} tasks and maintained visible progress.")
    if focus_minutes >= 180: strengths.append(f"You protected {_format_minutes(focus_minutes)} for focused work.")
    if len(current_habits) >= 5: strengths.append(f"You recorded {len(current_habits)} habit completions this week.")
    if average_sleep and 7 <= average_sleep <= 9: strengths.append(f"Your average sleep stayed in a supportive range at {average_sleep} hours.")
    if not strengths: strengths.append("You created enough activity data to begin identifying personal patterns.")

    watchouts = []
    if distractions: watchouts.append(f"{biggest_distraction} was your most frequent distraction across {len(distractions)} logs.")
    if average_sleep is not None and average_sleep < 7: watchouts.append(f"Average sleep was {average_sleep} hours, which may reduce sustainable focus.")
    if average_energy is not None and average_energy < 3: watchouts.append(f"Average energy was {average_energy}/5; reduce load before adding more commitments.")
    if focus_minutes < 120: watchouts.append("Deep-focus time was limited; protect one small uninterrupted block next week.")
    if not watchouts: watchouts.append("No major imbalance stands out; preserve the routines that supported this week.")

    if distractions and biggest_distraction:
        insight = {"title": "Protect your strongest work window", "message": f"Schedule demanding work during {most_productive_window or 'your best available morning block'} and remove {biggest_distraction.lower()} before starting.", "tone": "focus", "action_label": "Open schedule", "action_href": "/schedule"}
    elif focus_minutes < 120:
        insight = {"title": "Create one reliable deep-work anchor", "message": "Add three short focus sessions next week before increasing task volume.", "tone": "focus", "action_label": "Start focus", "action_href": "/focus"}
    else:
        insight = {"title": "Repeat what worked", "message": f"Your strongest pattern appeared on {best_day or 'your most active day'}. Reuse that structure for next week's hardest work.", "tone": "positive", "action_label": "Plan next week", "action_href": "/schedule"}

    metrics = [
        {"label": "Tasks completed", "value": len(current_tasks), "display_value": str(len(current_tasks)), "change": _percent_change(len(current_tasks), len(previous_tasks)), "change_label": "vs last week"},
        {"label": "Focus time", "value": focus_minutes, "display_value": _format_minutes(focus_minutes), "change": _percent_change(focus_minutes, previous_focus_minutes), "change_label": "vs last week"},
        {"label": "Tracked time", "value": tracked_minutes, "display_value": _format_minutes(tracked_minutes), "change": _percent_change(tracked_minutes, previous_tracked_minutes), "change_label": "vs last week"},
        {"label": "Habit completions", "value": len(current_habits), "display_value": str(len(current_habits)), "change": _percent_change(len(current_habits), len(previous_habits)), "change_label": "vs last week"},
    ]

    return {"period_start": start_date, "period_end": end_date, "generated_at": datetime.now(timezone.utc), "score": score, "score_label": score_label, "metrics": metrics, "daily_breakdown": day_rows, "strengths": strengths[:4], "watchouts": watchouts[:4], "insight": insight, "best_day": best_day, "most_productive_window": most_productive_window, "biggest_distraction": biggest_distraction, "average_sleep_hours": average_sleep, "average_energy": average_energy}
