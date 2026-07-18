from typing import Literal

from pydantic import BaseModel

RiskLevel = Literal["low", "moderate", "high"]
SignalTone = Literal["positive", "neutral", "attention", "high"]


class BurnoutSignal(BaseModel):
    key: str
    title: str
    value: str
    detail: str
    score: int
    max_score: int
    tone: SignalTone


class BurnoutRecommendation(BaseModel):
    title: str
    detail: str
    action: str
    priority: Literal["now", "today", "this_week"]


class BurnoutTrendPoint(BaseModel):
    date: str
    workload: int
    recovery: int


class BurnoutWorkspaceResponse(BaseModel):
    risk_score: int
    risk_level: RiskLevel
    headline: str
    summary: str
    disclaimer: str
    protective_factors: int
    warning_signals: int
    data_coverage: int
    signals: list[BurnoutSignal]
    recommendations: list[BurnoutRecommendation]
    trend: list[BurnoutTrendPoint]
