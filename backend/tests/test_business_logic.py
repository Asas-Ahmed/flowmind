from datetime import date, datetime, timedelta, timezone

import pytest

from app.models.habit import Habit
from app.services.focus_service import _adaptive_focus_recommendation, _nearest_duration
from app.services.habit_service import _streaks, is_scheduled
from app.services.task_service import _add_months, _next_occurrence

pytestmark = pytest.mark.unit


def _habit(**overrides):
    values = {
        "id": 1,
        "user_id": 1,
        "name": "Test",
        "category": "study",
        "frequency": "daily",
        "scheduled_days": [],
        "target_count": 1,
        "unit": "times",
        "start_date": date.today() - timedelta(days=10),
        "is_archived": False,
    }
    values.update(overrides)
    return Habit(**values)


def test_daily_habit_is_scheduled_today():
    assert is_scheduled(_habit(), date.today()) is True


def test_weekday_habit_excludes_weekend():
    saturday = date(2026, 8, 22)
    habit = _habit(frequency="weekdays", start_date=date(2026, 8, 1))
    assert is_scheduled(habit, saturday) is False


def test_habit_streaks_count_consecutive_completions():
    today = date.today()
    habit = _habit(start_date=today - timedelta(days=4))
    completed = {today - timedelta(days=2), today - timedelta(days=1), today}
    current, best = _streaks(habit, completed, today)
    assert current == 3
    assert best == 3


def test_nearest_focus_duration_bucket():
    assert _nearest_duration(27)[0] == 25
    assert _nearest_duration(48)[0] == 50


def test_adaptive_focus_defaults_to_25_while_learning():
    result = _adaptive_focus_recommendation([])
    assert result["recommended_minutes"] == 25
    assert result["confidence"] == "learning"


def test_daily_recurring_task_advances_one_day():
    now = datetime(2026, 8, 19, 10, 0, tzinfo=timezone.utc)
    assert _next_occurrence(now, "daily", 1) == now + timedelta(days=1)


def test_weekday_recurring_task_skips_weekend():
    friday = datetime(2026, 8, 21, 10, 0, tzinfo=timezone.utc)
    monday = _next_occurrence(friday, "weekdays", 1)
    assert monday.weekday() == 0
    assert monday.date() == date(2026, 8, 24)


def test_add_months_handles_end_of_month():
    value = datetime(2026, 1, 31, 10, 0, tzinfo=timezone.utc)
    assert _add_months(value, 1).date() == date(2026, 2, 28)
