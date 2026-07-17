from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ProfileUpdate(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    timezone: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    daily_focus_goal_minutes: int = Field(
        ...,
        ge=15,
        le=720,
    )

    week_starts_on: str = Field(
        ...,
        pattern="^(monday|sunday)$",
    )

    email_notifications: bool
    task_reminders: bool
    habit_reminders: bool
    weekly_summary: bool
    compact_dashboard: bool

    @field_validator("full_name")
    @classmethod
    def normalize_full_name(cls, value: str) -> str:
        normalized = " ".join(value.strip().split())

        if len(normalized) < 2:
            raise ValueError("Full name must contain at least 2 characters")

        return normalized

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str) -> str:
        timezone_name = value.strip()

        try:
            ZoneInfo(timezone_name)
        except ZoneInfoNotFoundError as error:
            raise ValueError("Please select a valid timezone") from error

        return timezone_name


class ProfileResponse(BaseModel):
    id: int
    full_name: str
    email: str
    is_email_verified: bool
    is_active: bool
    created_at: datetime

    timezone: str
    daily_focus_goal_minutes: int
    week_starts_on: str

    email_notifications: bool
    task_reminders: bool
    habit_reminders: bool
    weekly_summary: bool
    compact_dashboard: bool

    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProfileMessageResponse(BaseModel):
    message: str
    profile: ProfileResponse