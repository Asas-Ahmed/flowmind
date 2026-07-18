from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class TimeProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    color: str = Field(default="#4f46e5", min_length=4, max_length=20)


class TimeProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    color: str | None = Field(default=None, min_length=4, max_length=20)
    is_archived: bool | None = None


class TimeProjectResponse(BaseModel):
    id: int
    user_id: int
    name: str
    color: str
    is_archived: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class TimerStartRequest(BaseModel):
    description: str = Field(min_length=1, max_length=180)
    project_id: int | None = None
    tags: list[str] = Field(default_factory=list, max_length=12)
    is_billable: bool = False
    note: str | None = Field(default=None, max_length=500)


class ManualTimeEntryCreate(BaseModel):
    description: str = Field(min_length=1, max_length=180)
    project_id: int | None = None
    tags: list[str] = Field(default_factory=list, max_length=12)
    is_billable: bool = False
    started_at: datetime
    ended_at: datetime
    note: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_range(self):
        if self.ended_at <= self.started_at:
            raise ValueError("End time must be after start time")
        if (self.ended_at - self.started_at).total_seconds() > 86400:
            raise ValueError("A single entry cannot exceed 24 hours")
        return self


class TimeEntryUpdate(BaseModel):
    description: str | None = Field(default=None, min_length=1, max_length=180)
    project_id: int | None = None
    tags: list[str] | None = Field(default=None, max_length=12)
    is_billable: bool | None = None
    started_at: datetime | None = None
    ended_at: datetime | None = None
    note: str | None = Field(default=None, max_length=500)


class TimeEntryResponse(BaseModel):
    id: int
    user_id: int
    project_id: int | None
    description: str
    tags: list[str]
    is_billable: bool
    started_at: datetime
    ended_at: datetime | None
    duration_seconds: int
    source: Literal["timer", "manual"]
    note: str | None
    created_at: datetime
    updated_at: datetime
    project: TimeProjectResponse | None = None
    model_config = ConfigDict(from_attributes=True)


class TimeBreakdownItem(BaseModel):
    label: str
    seconds: int
    percentage: float
    color: str | None = None


class DailyTimeTotal(BaseModel):
    date: str
    seconds: int


class TimeTrackingInsight(BaseModel):
    title: str
    message: str
    recommendation: str
    tone: Literal["neutral", "positive", "attention"]


class TimeTrackingWorkspaceResponse(BaseModel):
    active_entry: TimeEntryResponse | None
    today_seconds: int
    week_seconds: int
    billable_week_seconds: int
    average_daily_seconds: int
    entries_this_week: int
    projects: list[TimeProjectResponse]
    project_breakdown: list[TimeBreakdownItem]
    tag_breakdown: list[TimeBreakdownItem]
    daily_totals: list[DailyTimeTotal]
    insight: TimeTrackingInsight
    entries: list[TimeEntryResponse]
