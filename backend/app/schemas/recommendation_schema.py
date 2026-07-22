from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class RecommendationEvidence(BaseModel):
    label: str
    value: str


class RecommendationAction(BaseModel):
    label: str
    href: str


class ProductivityRecommendation(BaseModel):
    id: str
    title: str
    message: str
    reason: str
    category: str
    priority: Literal["high", "medium", "low"]
    confidence: Literal["high", "medium", "early"]
    impact: Literal["focus", "planning", "wellbeing", "consistency", "completion-risk"]
    evidence: list[RecommendationEvidence]
    action: RecommendationAction


class RecommendationWorkspaceResponse(BaseModel):
    generated_at: datetime
    horizon_days: int
    headline: str
    summary: str
    readiness_score: int
    signals_analyzed: int
    high_priority_count: int
    recommendations: list[ProductivityRecommendation]
    data_gaps: list[str]
    disclaimer: str
