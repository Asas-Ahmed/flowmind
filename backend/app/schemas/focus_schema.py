from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

FocusMode = Literal["focus", "short_break", "long_break"]
FocusStatus = Literal["active", "paused", "completed", "cancelled"]


class FocusSessionCreate(BaseModel):
    title: str = Field(default="Focus session", min_length=1, max_length=160)
    task_id: int | None = Field(default=None, ge=1)
    mode: FocusMode = "focus"
    planned_minutes: int = Field(default=25, ge=1, le=180)

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        return " ".join(value.strip().split())


class FocusSessionAction(BaseModel):
    elapsed_seconds: int = Field(default=0, ge=0, le=24 * 60 * 60)
    note: str | None = Field(default=None, max_length=1000)


class FocusSessionResponse(BaseModel):
    id: int
    user_id: int
    task_id: int | None
    title: str
    mode: FocusMode
    status: FocusStatus
    planned_minutes: int
    elapsed_seconds: int
    started_at: datetime
    paused_at: datetime | None
    completed_at: datetime | None
    note: str | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class FocusDailyPoint(BaseModel):
    date: date
    minutes: int
    sessions: int


class FocusWorkspaceResponse(BaseModel):
    active_session: FocusSessionResponse | None
    recent_sessions: list[FocusSessionResponse]
    today_minutes: int
    today_sessions: int
    weekly_minutes: int
    weekly_sessions: int
    completion_rate: float
    current_streak: int
    best_streak: int
    daily_goal_minutes: int
    daily_points: list[FocusDailyPoint]
