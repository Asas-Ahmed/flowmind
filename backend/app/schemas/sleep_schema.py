from datetime import date, datetime, time
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

SleepQuality = Literal[1, 2, 3, 4, 5]


class SleepRecordCreate(BaseModel):
    sleep_date: date
    bedtime: time
    wake_time: time
    quality: SleepQuality
    note: str | None = Field(default=None, max_length=500)


class SleepRecordResponse(BaseModel):
    id: int
    user_id: int
    sleep_date: date
    bedtime: time
    wake_time: time
    duration_hours: float
    quality: SleepQuality
    note: str | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class SleepTrendPoint(BaseModel):
    date: date
    duration_hours: float
    quality: int
    bedtime_minutes: int | None
    wake_minutes: int | None
    has_record: bool


class SleepInsight(BaseModel):
    key: str
    title: str
    message: str
    action: str
    tone: Literal["steady", "attention", "positive", "neutral"]


class SleepWorkspaceResponse(BaseModel):
    latest_record: SleepRecordResponse | None
    average_duration: float
    average_quality: float
    bedtime_variation_minutes: int
    wake_variation_minutes: int
    consistency_score: int
    weekly_records: int
    insight: SleepInsight
    trend_points: list[SleepTrendPoint]
    recent_records: list[SleepRecordResponse]
