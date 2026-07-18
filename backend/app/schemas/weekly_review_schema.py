from datetime import date, datetime

from pydantic import BaseModel


class WeeklyMetric(BaseModel):
    label: str
    value: float
    display_value: str
    change: float | None = None
    change_label: str | None = None


class WeeklyDay(BaseModel):
    date: date
    label: str
    tasks_completed: int
    focus_minutes: int
    tracked_minutes: int
    habit_completions: int
    score: int


class WeeklyInsight(BaseModel):
    title: str
    message: str
    tone: str
    action_label: str
    action_href: str


class WeeklyReviewResponse(BaseModel):
    period_start: date
    period_end: date
    generated_at: datetime
    score: int
    score_label: str
    metrics: list[WeeklyMetric]
    daily_breakdown: list[WeeklyDay]
    strengths: list[str]
    watchouts: list[str]
    insight: WeeklyInsight
    best_day: str | None
    most_productive_window: str | None
    biggest_distraction: str | None
    average_sleep_hours: float | None
    average_energy: float | None
