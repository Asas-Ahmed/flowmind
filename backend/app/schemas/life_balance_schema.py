from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class LifeBalanceCheckInCreate(BaseModel):
    area_key: str = Field(min_length=1, max_length=40)
    score: int = Field(ge=1, le=10)
    note: str | None = Field(default=None, max_length=1000)
    next_action: str | None = Field(default=None, max_length=240)
    checkin_date: date | None = None


class LifeBalanceCheckInResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    area_key: str
    score: int
    note: str | None
    next_action: str | None
    checkin_date: date
    created_at: datetime
    updated_at: datetime


class LifeBalanceArea(BaseModel):
    key: str
    name: str
    description: str
    icon: str
    color: str
    score: int
    previous_score: int | None
    trend: int
    status: str
    last_checkin: date | None
    note: str | None
    next_action: str
    suggestions: list[str]


class LifeBalanceSummary(BaseModel):
    overall_score: int
    checked_areas: int
    total_areas: int
    strong_areas: int
    attention_areas: int
    current_streak: int
    last_checkin: date | None


class LifeBalanceWorkspaceResponse(BaseModel):
    summary: LifeBalanceSummary
    areas: list[LifeBalanceArea]
    priority_areas: list[str]
    assistant_message: str
    weekly_challenge: str
    history: list[LifeBalanceCheckInResponse]
