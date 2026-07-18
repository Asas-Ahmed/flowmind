from datetime import date
from pydantic import BaseModel


class ProductivityHeatmapDay(BaseModel):
    date: date
    score: int
    level: int
    tasks_completed: int
    focus_minutes: int
    habit_completions: int
    energy_average: float | None
    sleep_hours: float | None
    sleep_quality: int | None


class ProductivityHeatmapSummary(BaseModel):
    active_days: int
    total_days: int
    average_score: int
    best_score: int
    best_date: date | None
    current_streak: int
    longest_streak: int
    total_tasks: int
    total_focus_minutes: int
    total_habits: int


class ProductivityHeatmapInsight(BaseModel):
    title: str
    message: str


class ProductivityHeatmapResponse(BaseModel):
    year: int
    available_years: list[int]
    days: list[ProductivityHeatmapDay]
    summary: ProductivityHeatmapSummary
    insight: ProductivityHeatmapInsight
