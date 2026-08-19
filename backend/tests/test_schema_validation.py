from datetime import date, datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.schemas.auth_schema import ResetPasswordRequest, UserRegister
from app.schemas.focus_schema import FocusSessionCreate
from app.schemas.habit_schema import HabitCreate
from app.schemas.profile_schema import ProfileUpdate
from app.schemas.schedule_schema import ScheduleEventCreate, SmartScheduleRequest
from app.schemas.task_schema import TaskCreate
from app.schemas.time_tracking_schema import ManualTimeEntryCreate

pytestmark = pytest.mark.unit


def test_registration_normalizes_email():
    model = UserRegister(full_name="Test User", email="  TEST@Example.COM  ", password="Pass1234")
    assert model.email == "test@example.com"


@pytest.mark.parametrize("password", ["abcdefgh", "12345678", "short1"])
def test_registration_rejects_weak_passwords(password):
    with pytest.raises(ValidationError):
        UserRegister(full_name="Test User", email="test@example.com", password=password)


def test_reset_password_requires_letter_and_number():
    with pytest.raises(ValidationError):
        ResetPasswordRequest(token="abc", new_password="onlyletters")


def test_task_rejects_due_before_start():
    start = datetime.now(timezone.utc)
    with pytest.raises(ValidationError):
        TaskCreate(title="Invalid", start_at=start, due_at=start - timedelta(hours=1))


def test_task_requires_reminder_time_when_enabled():
    with pytest.raises(ValidationError):
        TaskCreate(title="Invalid reminder", reminder_enabled=True)


def test_task_cleans_duplicate_tags():
    model = TaskCreate(title="  Clean   title  ", tags=["#DP", "dp", " Testing "])
    assert model.title == "Clean title"
    assert model.tags == ["dp", "testing"]


def test_custom_habit_requires_scheduled_days():
    with pytest.raises(ValidationError):
        HabitCreate(name="Gym", frequency="custom", scheduled_days=[])


def test_habit_rejects_end_before_start():
    with pytest.raises(ValidationError):
        HabitCreate(name="Gym", start_date=date.today(), end_date=date.today() - timedelta(days=1))


def test_focus_minutes_are_bounded():
    with pytest.raises(ValidationError):
        FocusSessionCreate(title="Too long", planned_minutes=181)


def test_schedule_rejects_invalid_time_range():
    now = datetime.now(timezone.utc)
    with pytest.raises(ValidationError):
        ScheduleEventCreate(title="Bad event", start_at=now, end_at=now - timedelta(minutes=1))


def test_smart_schedule_rejects_inverted_date_range():
    with pytest.raises(ValidationError):
        SmartScheduleRequest(range_start=date.today(), range_end=date.today() - timedelta(days=1))


def test_profile_rejects_unknown_timezone():
    with pytest.raises(ValidationError):
        ProfileUpdate(
            full_name="Test User",
            timezone="Mars/Olympus",
            daily_focus_goal_minutes=120,
            week_starts_on="monday",
            email_notifications=True,
            task_reminders=True,
            habit_reminders=True,
            weekly_summary=True,
            compact_dashboard=False,
        )


def test_manual_time_entry_requires_end_after_start():
    start = datetime.now(timezone.utc)
    with pytest.raises(ValidationError):
        ManualTimeEntryCreate(description="Bad", started_at=start, ended_at=start)
