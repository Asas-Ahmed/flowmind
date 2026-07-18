from datetime import date, datetime

from pydantic import BaseModel


class ProductivityComponent(BaseModel):
    key: str
    label: str
    score: int
    weight: int
    weighted_points: float
    current: int
    target: int
    unit: str
    explanation: str
    action_label: str
    action_href: str


class ProductivityTrendPoint(BaseModel):
    date: date
    day: str
    score: int
    tasks: int
    habits: int
    focus_minutes: int
    overdue_penalty: int


class ProductivityRecommendation(BaseModel):
    title: str
    message: str
    priority: str
    action_label: str
    action_href: str


class ProductivityResponse(BaseModel):
    generated_at: datetime
    score: int
    previous_score: int
    score_change: int
    level: str
    summary: str
    data_confidence: str
    active_days: int
    overdue_tasks: int
    overdue_penalty: int
    components: list[ProductivityComponent]
    trend: list[ProductivityTrendPoint]
    recommendations: list[ProductivityRecommendation]
