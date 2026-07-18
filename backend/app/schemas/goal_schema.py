from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

GoalType = Literal["tasks", "focus_minutes", "habit_completions", "tracked_minutes"]


class GoalCreate(BaseModel):
    title: str = Field(min_length=1, max_length=100)
    goal_type: GoalType
    target_value: int = Field(ge=1, le=100000)
    color: str = Field(default="#4f46e5", pattern=r"^#[0-9a-fA-F]{6}$")


class GoalUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=100)
    goal_type: GoalType | None = None
    target_value: int | None = Field(default=None, ge=1, le=100000)
    color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
    is_active: bool | None = None


class GoalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    goal_type: GoalType
    target_value: int
    color: str
    is_active: bool
    created_at: datetime
    updated_at: datetime


class GoalProgress(GoalResponse):
    current_value: int
    percentage: int
    remaining_value: int
    is_complete: bool
    display_current: str
    display_target: str


class GoalsSummary(BaseModel):
    total_goals: int
    completed_goals: int
    average_progress: int
    week_start: date
    week_end: date


class GoalsWorkspaceResponse(BaseModel):
    summary: GoalsSummary
    goals: list[GoalProgress]
    suggestion: str
