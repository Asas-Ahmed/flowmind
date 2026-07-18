from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

MovementRoutine = Literal[
    "full_body",
    "shoulders_neck",
    "wrists_hands",
    "walk_water",
    "posture_reset",
]
MovementStatus = Literal["completed", "skipped"]


class MovementBreakCreate(BaseModel):
    routine: MovementRoutine = "full_body"
    status: MovementStatus = "completed"
    duration_seconds: int = Field(default=120, ge=0, le=15 * 60)


class MovementBreakResponse(BaseModel):
    id: int
    user_id: int
    routine: MovementRoutine
    status: MovementStatus
    duration_seconds: int
    trigger_focus_sessions: int
    completed_at: datetime
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MovementDailyPoint(BaseModel):
    date: date
    completed: int
    minutes: int


class MovementWorkspaceResponse(BaseModel):
    break_due: bool
    focus_sessions_since_break: int
    sessions_until_break: int
    today_completed: int
    today_minutes: int
    weekly_completed: int
    current_streak: int
    best_streak: int
    completion_rate: float
    recent_breaks: list[MovementBreakResponse]
    daily_points: list[MovementDailyPoint]
