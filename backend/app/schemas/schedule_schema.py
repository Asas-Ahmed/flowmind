from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

ScheduleEventType = Literal["event", "meeting", "study", "focus", "personal"]
ScheduleItemSource = Literal["event", "task", "habit", "focus"]


class ScheduleEventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=2000)
    event_type: ScheduleEventType = "event"
    color: str = Field(default="#4a6ded", min_length=4, max_length=20)
    location: str | None = Field(default=None, max_length=180)
    task_id: int | None = Field(default=None, ge=1)
    start_at: datetime
    end_at: datetime
    is_all_day: bool = False
    reminder_enabled: bool = True
    reminder_minutes_before: int = Field(default=15, ge=0, le=10080)

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        return " ".join(value.strip().split())

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_at <= self.start_at:
            raise ValueError("End time must be after the start time.")
        return self


class ScheduleEventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=2000)
    event_type: ScheduleEventType | None = None
    color: str | None = Field(default=None, min_length=4, max_length=20)
    location: str | None = Field(default=None, max_length=180)
    task_id: int | None = Field(default=None, ge=1)
    start_at: datetime | None = None
    end_at: datetime | None = None
    is_all_day: bool | None = None
    reminder_enabled: bool | None = None
    reminder_minutes_before: int | None = Field(default=None, ge=0, le=10080)

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str | None) -> str | None:
        return " ".join(value.strip().split()) if value else value


class ScheduleEventResponse(BaseModel):
    id: int
    user_id: int
    task_id: int | None
    title: str
    description: str | None
    event_type: ScheduleEventType
    color: str
    location: str | None
    start_at: datetime
    end_at: datetime
    is_all_day: bool
    reminder_enabled: bool
    reminder_minutes_before: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ScheduleItem(BaseModel):
    id: str
    source: ScheduleItemSource
    source_id: int
    title: str
    description: str | None = None
    start_at: datetime
    end_at: datetime | None = None
    is_all_day: bool = False
    color: str
    status: str | None = None
    reminder_at: datetime | None = None
    location: str | None = None


class ScheduleDaySummary(BaseModel):
    date: date
    total: int
    tasks: int
    events: int
    habits: int
    focus: int


class ScheduleWorkspaceResponse(BaseModel):
    range_start: date
    range_end: date
    items: list[ScheduleItem]
    events: list[ScheduleEventResponse]
    day_summaries: list[ScheduleDaySummary]
    upcoming_count: int
    today_count: int
    overdue_count: int
    reminder_count: int


class SmartScheduleRequest(BaseModel):
    range_start: date
    range_end: date
    workday_start_hour: int = Field(default=9, ge=0, le=22)
    workday_end_hour: int = Field(default=18, ge=1, le=23)
    slot_minutes: int = Field(default=30, ge=15, le=120)
    break_minutes: int = Field(default=15, ge=0, le=60)
    max_items: int = Field(default=8, ge=1, le=20)
    include_weekends: bool = False
    timezone_offset_minutes: int = Field(default=0, ge=-840, le=840)

    @model_validator(mode="after")
    def validate_range_and_hours(self):
        if self.range_end < self.range_start:
            raise ValueError("Range end cannot be before range start.")
        if (self.range_end - self.range_start).days > 30:
            raise ValueError("Smart scheduling range cannot exceed 31 days.")
        if self.workday_end_hour <= self.workday_start_hour:
            raise ValueError("Workday end must be after workday start.")
        return self


class SmartScheduleSuggestion(BaseModel):
    task_id: int
    task_title: str
    start_at: datetime
    end_at: datetime
    duration_minutes: int
    score: int
    priority_label: str
    energy_level: str
    due_at: datetime | None = None
    reason: str
    warning: str | None = None


class SmartScheduleResponse(BaseModel):
    suggestions: list[SmartScheduleSuggestion]
    unscheduled_task_count: int
    scheduled_minutes: int
    remaining_task_count: int
    explanation: str


class SmartScheduleApplyRequest(BaseModel):
    suggestions: list[SmartScheduleSuggestion] = Field(min_length=1, max_length=20)


class SmartScheduleApplyResponse(BaseModel):
    created_events: list[ScheduleEventResponse]
    created_count: int
    skipped_count: int
