from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.habit import Habit, HabitCompletion
from app.models.user import User
from app.repositories.habit_repo import get_completion, get_habit, list_completions, list_habits
from app.schemas.habit_schema import HabitCheckIn, HabitCreate, HabitUpdate


def is_scheduled(habit: Habit, day: date) -> bool:
    if day < habit.start_date or (habit.end_date and day > habit.end_date):
        return False
    if habit.frequency == "daily":
        return True
    if habit.frequency == "weekdays":
        return day.weekday() < 5
    if habit.frequency == "weekly":
        return day.weekday() == habit.start_date.weekday()
    return day.weekday() in (habit.scheduled_days or [])


def _streaks(habit: Habit, completion_dates: set[date], today: date) -> tuple[int, int]:
    scheduled_dates: list[date] = []
    cursor = habit.start_date
    end = min(today, habit.end_date) if habit.end_date else today
    while cursor <= end:
        if is_scheduled(habit, cursor):
            scheduled_dates.append(cursor)
        cursor += timedelta(days=1)

    best = 0
    running = 0
    for scheduled_date in scheduled_dates:
        if scheduled_date in completion_dates:
            running += 1
            best = max(best, running)
        else:
            running = 0

    current = 0
    for scheduled_date in reversed(scheduled_dates):
        if scheduled_date in completion_dates:
            current += 1
        elif scheduled_date < today:
            break
    return current, best


def serialize_habit(habit: Habit, completions: list[HabitCompletion], today: date) -> dict:
    own = [item for item in completions if item.habit_id == habit.id]
    completion_dates = {item.completion_date for item in own if item.count >= habit.target_count}
    today_completion = next((item for item in own if item.completion_date == today), None)
    current, best = _streaks(habit, completion_dates, today)

    scheduled = 0
    completed = 0
    cursor = max(habit.start_date, today - timedelta(days=29))
    while cursor <= today:
        if is_scheduled(habit, cursor):
            scheduled += 1
            if cursor in completion_dates:
                completed += 1
        cursor += timedelta(days=1)

    data = {column.name: getattr(habit, column.name) for column in habit.__table__.columns}
    data.update(
        current_streak=current,
        best_streak=best,
        completed_today=bool(today_completion and today_completion.count >= habit.target_count),
        today_count=today_completion.count if today_completion else 0,
        completion_rate=round((completed / scheduled * 100) if scheduled else 0, 1),
    )
    return data


def get_workspace(db: Session, user: User, target_date: date) -> dict:
    habits = list_habits(db, user.id)
    date_from = target_date - timedelta(days=90)
    completions = list_completions(db, user.id, date_from=date_from, date_to=target_date)
    serialized = [serialize_habit(habit, completions, target_date) for habit in habits]
    scheduled_today = [item for item, habit in zip(serialized, habits) if is_scheduled(habit, target_date)]

    week_from = target_date - timedelta(days=6)
    expected = 0
    achieved = 0
    for habit in habits:
        cursor = week_from
        while cursor <= target_date:
            if is_scheduled(habit, cursor):
                expected += 1
                completion = next(
                    (
                        item
                        for item in completions
                        if item.habit_id == habit.id and item.completion_date == cursor
                    ),
                    None,
                )
                if completion and completion.count >= habit.target_count:
                    achieved += 1
            cursor += timedelta(days=1)

    return {
        "habits": serialized,
        "completions": completions,
        "today_completed": sum(1 for item in scheduled_today if item["completed_today"]),
        "today_total": len(scheduled_today),
        "weekly_rate": round((achieved / expected * 100) if expected else 0, 1),
        "longest_streak": max((item["best_streak"] for item in serialized), default=0),
    }


def create_habit(db: Session, user: User, data: HabitCreate) -> Habit:
    habit = Habit(user_id=user.id, **data.model_dump())
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


def update_habit(db: Session, user: User, habit_id: int, data: HabitUpdate) -> Habit:
    habit = get_habit(db, user.id, habit_id)
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")

    values = data.model_dump(exclude_unset=True)
    if "scheduled_days" in values and values["scheduled_days"] is not None:
        values["scheduled_days"] = sorted(set(values["scheduled_days"]))
    for key, value in values.items():
        setattr(habit, key, value)
    habit.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(habit)
    return habit


def delete_habit(db: Session, user: User, habit_id: int) -> None:
    habit = get_habit(db, user.id, habit_id)
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    db.delete(habit)
    db.commit()


def check_in(db: Session, user: User, habit_id: int, data: HabitCheckIn) -> HabitCompletion | None:
    habit = get_habit(db, user.id, habit_id)
    if not habit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
    if not is_scheduled(habit, data.completion_date):
        raise HTTPException(status_code=400, detail="This habit is not scheduled for the selected date")

    completion = get_completion(db, user.id, habit_id, data.completion_date)
    if data.count == 0:
        if completion:
            db.delete(completion)
            db.commit()
        return None

    if completion:
        completion.count = data.count
        completion.note = data.note
        completion.completed_at = datetime.now(timezone.utc)
    else:
        completion = HabitCompletion(
            habit_id=habit.id,
            user_id=user.id,
            completion_date=data.completion_date,
            count=data.count,
            note=data.note,
        )
        db.add(completion)
    db.commit()
    db.refresh(completion)
    return completion
