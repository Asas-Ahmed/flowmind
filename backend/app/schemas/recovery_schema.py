from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

RecoveryBreakType = Literal["breathing", "stretching", "eye_care", "water", "quiet_rest", "short_walk"]
RecoveryFeedback = Literal["better", "same", "worse"]


class RecoveryBreakCreate(BaseModel):
    break_type: RecoveryBreakType
    duration_minutes: int = Field(ge=1, le=30)
    feedback: RecoveryFeedback
    note: str | None = Field(default=None, max_length=180)


class RecoveryBreakResponse(BaseModel):
    id: int
    user_id: int
    break_type: RecoveryBreakType
    duration_minutes: int
    feedback: RecoveryFeedback
    note: str | None
    completed_at: datetime
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class RecoveryDailyPoint(BaseModel):
    date: date
    breaks: int
    helpful_breaks: int
    minutes: int


class RecoveryTypeStat(BaseModel):
    break_type: RecoveryBreakType
    sessions: int
    helpful_rate: float


class RecoveryWorkspaceResponse(BaseModel):
    today_breaks: int
    today_minutes: int
    weekly_breaks: int
    weekly_minutes: int
    helpful_rate: float
    current_streak: int
    recommended_type: RecoveryBreakType
    assistant_title: str
    assistant_message: str
    recent_breaks: list[RecoveryBreakResponse]
    daily_points: list[RecoveryDailyPoint]
    type_stats: list[RecoveryTypeStat]
