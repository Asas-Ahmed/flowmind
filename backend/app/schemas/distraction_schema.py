from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

DistractionType = Literal[
    "phone", "social_media", "noise", "messages", "hunger", "tiredness", "thoughts", "other"
]
DistractionContext = Literal["focus", "study", "work", "task", "break", "other"]


class DistractionCreate(BaseModel):
    distraction_type: DistractionType
    context: DistractionContext = "other"
    intensity: int = Field(default=2, ge=1, le=3)
    minutes_lost: int = Field(default=0, ge=0, le=480)
    recovery_action: str | None = Field(default=None, max_length=180)
    note: str | None = Field(default=None, max_length=500)
    occurred_at: datetime | None = None


class DistractionResponse(BaseModel):
    id: int
    user_id: int
    distraction_type: DistractionType
    context: DistractionContext
    intensity: int
    minutes_lost: int
    recovery_action: str | None
    note: str | None
    occurred_at: datetime
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class DistractionBreakdownItem(BaseModel):
    distraction_type: DistractionType
    count: int
    percentage: float


class DistractionInsight(BaseModel):
    title: str
    message: str
    experiment: str
    tone: Literal["neutral", "positive", "attention"]


class DistractionWorkspaceResponse(BaseModel):
    total_logs: int
    logs_this_week: int
    minutes_lost_this_week: int
    most_common_distraction: DistractionType | None
    peak_hour: int | None
    breakdown: list[DistractionBreakdownItem]
    insight: DistractionInsight
    logs: list[DistractionResponse]
