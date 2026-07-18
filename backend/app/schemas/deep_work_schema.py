from datetime import date
from typing import Literal

from pydantic import BaseModel


class DeepWorkDailyPoint(BaseModel):
    date: date
    label: str
    minutes: int
    sessions: int
    interruptions: int
    score: int


class DeepWorkSessionBand(BaseModel):
    label: str
    range_label: str
    sessions: int
    total_minutes: int
    completion_rate: float


class DeepWorkInsight(BaseModel):
    title: str
    message: str
    action_label: str
    action_href: str
    tone: Literal["positive", "neutral", "attention"]


class DeepWorkWorkspaceResponse(BaseModel):
    score: int
    score_label: str
    weekly_minutes: int
    previous_week_minutes: int
    weekly_change: float | None
    completed_sessions: int
    average_session_minutes: int
    longest_session_minutes: int
    interruptions: int
    interruption_minutes: int
    average_recovery_minutes: int
    uninterrupted_rate: float
    best_focus_hour: int | None
    best_focus_window: str | None
    daily_points: list[DeepWorkDailyPoint]
    session_bands: list[DeepWorkSessionBand]
    insight: DeepWorkInsight
