from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

StarterTechnique = Literal[
    "two_minute_rule",
    "smallest_step",
    "timebox",
    "remove_friction",
    "easy_entry",
]


class ProcrastinationStarterCreate(BaseModel):
    task_name: str = Field(min_length=1, max_length=160)
    obstacle: str | None = Field(default=None, max_length=500)
    technique: StarterTechnique
    first_step: str = Field(min_length=1, max_length=240)
    starter_minutes: int = Field(default=5, ge=2, le=25)


class ProcrastinationStarterResponse(BaseModel):
    id: int
    user_id: int
    task_name: str
    obstacle: str | None
    technique: StarterTechnique
    first_step: str
    starter_minutes: int
    is_completed: bool
    completed_at: datetime | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ProcrastinationInsight(BaseModel):
    title: str
    message: str
    next_action: str
    tone: Literal["neutral", "positive", "attention"]


class ProcrastinationWorkspaceResponse(BaseModel):
    total_starters: int
    completed_starters: int
    completion_rate: float
    active_starters: int
    most_used_technique: StarterTechnique | None
    insight: ProcrastinationInsight
    starters: list[ProcrastinationStarterResponse]
