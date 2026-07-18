from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ActivityKind = Literal[
    "task",
    "habit",
    "focus",
    "time_tracking",
    "schedule",
    "energy",
    "movement",
    "nourishment",
    "recovery",
    "distraction",
]


class ActivityItem(BaseModel):
    id: str
    kind: ActivityKind
    title: str
    description: str
    occurred_at: datetime
    duration_minutes: int | None = None
    metadata: dict[str, str | int | float | bool | None] = Field(default_factory=dict)


class ActivitySummary(BaseModel):
    total_events: int
    active_days: int
    tasks_completed: int
    focus_minutes: int
    tracked_minutes: int


class ActivityTimelineResponse(BaseModel):
    items: list[ActivityItem]
    summary: ActivitySummary
    available_kinds: list[ActivityKind]
