from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

CognitiveDifficulty = Literal["light", "moderate", "deep"]
InsightTone = Literal["balanced", "attention", "positive", "neutral"]


class CognitiveLoadEntryCreate(BaseModel):
    entry_date: date
    title: str = Field(min_length=1, max_length=180)
    difficulty: CognitiveDifficulty
    estimated_minutes: int = Field(default=30, ge=5, le=480)
    note: str | None = Field(default=None, max_length=500)


class CognitiveLoadEntryResponse(BaseModel):
    id: int
    user_id: int
    entry_date: date
    title: str
    difficulty: CognitiveDifficulty
    estimated_minutes: int
    note: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CognitiveLoadDayPoint(BaseModel):
    date: date
    score: int
    light_count: int
    moderate_count: int
    deep_count: int


class CognitiveLoadInsight(BaseModel):
    key: str
    title: str
    message: str
    action: str
    tone: InsightTone


class CognitiveLoadWorkspaceResponse(BaseModel):
    today_score: int
    capacity_score: int
    load_level: Literal["empty", "light", "balanced", "high", "overloaded"]
    today_entries: int
    light_count: int
    moderate_count: int
    deep_count: int
    estimated_minutes: int
    weekly_average: float
    insight: CognitiveLoadInsight
    week_points: list[CognitiveLoadDayPoint]
    recent_entries: list[CognitiveLoadEntryResponse]
