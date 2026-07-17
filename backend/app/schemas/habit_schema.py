from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

HabitFrequency = Literal["daily", "weekdays", "weekly", "custom"]
HabitCategory = Literal["health", "study", "work", "mindfulness", "fitness", "personal"]


class HabitBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    category: HabitCategory = "personal"
    color: str = Field(default="#4a6ded", pattern=r"^#[0-9a-fA-F]{6}$")
    icon: str = Field(default="sparkles", max_length=40)
    frequency: HabitFrequency = "daily"
    scheduled_days: list[int] = Field(default_factory=list, max_length=7)
    target_count: int = Field(default=1, ge=1, le=1000)
    unit: str = Field(default="times", min_length=1, max_length=30)
    reminder_enabled: bool = False
    reminder_time: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    start_date: date = Field(default_factory=date.today)
    end_date: date | None = None
    is_archived: bool = False

    @field_validator("name", "unit")
    @classmethod
    def clean_text(cls, value: str) -> str:
        return " ".join(value.strip().split())

    @field_validator("scheduled_days")
    @classmethod
    def clean_days(cls, values: list[int]) -> list[int]:
        return sorted(set(values))

    @model_validator(mode="after")
    def validate_schedule(self):
        if any(day < 0 or day > 6 for day in self.scheduled_days):
            raise ValueError("Scheduled days must be between 0 and 6")
        if self.frequency == "custom" and not self.scheduled_days:
            raise ValueError("Choose at least one day for a custom habit")
        if self.reminder_enabled and not self.reminder_time:
            raise ValueError("Reminder time is required when reminders are enabled")
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("End date cannot be before the start date")
        return self


class HabitCreate(HabitBase):
    pass


class HabitUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    category: HabitCategory | None = None
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    icon: str | None = Field(default=None, max_length=40)
    frequency: HabitFrequency | None = None
    scheduled_days: list[int] | None = Field(default=None, max_length=7)
    target_count: int | None = Field(default=None, ge=1, le=1000)
    unit: str | None = Field(default=None, min_length=1, max_length=30)
    reminder_enabled: bool | None = None
    reminder_time: str | None = Field(default=None, pattern=r"^([01]\d|2[0-3]):[0-5]\d$")
    start_date: date | None = None
    end_date: date | None = None
    is_archived: bool | None = None


class HabitCompletionResponse(BaseModel):
    id: int
    habit_id: int
    completion_date: date
    count: int
    note: str | None
    completed_at: datetime
    model_config = ConfigDict(from_attributes=True)


class HabitResponse(HabitBase):
    id: int
    user_id: int
    current_streak: int = 0
    best_streak: int = 0
    completed_today: bool = False
    today_count: int = 0
    completion_rate: float = 0
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class HabitCheckIn(BaseModel):
    completion_date: date = Field(default_factory=date.today)
    count: int = Field(default=1, ge=0, le=1000)
    note: str | None = Field(default=None, max_length=300)


class HabitWorkspaceResponse(BaseModel):
    habits: list[HabitResponse]
    completions: list[HabitCompletionResponse]
    today_completed: int
    today_total: int
    weekly_rate: float
    longest_streak: int
