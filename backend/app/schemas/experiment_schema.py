from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ExperimentMetric = Literal["focus_rating", "productivity_score", "completion_quality", "energy_after"]
ExperimentCondition = Literal["A", "B"]


class ExperimentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    hypothesis: str | None = Field(default=None, max_length=600)
    condition_a: str = Field(min_length=1, max_length=160)
    condition_b: str = Field(min_length=1, max_length=160)
    metric: ExperimentMetric


class ExperimentTrialCreate(BaseModel):
    condition: ExperimentCondition
    score: float = Field(ge=1, le=10)
    note: str | None = Field(default=None, max_length=500)


class ExperimentTrialResponse(BaseModel):
    id: int
    experiment_id: int
    condition: ExperimentCondition
    score: float
    note: str | None
    recorded_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ExperimentResponse(BaseModel):
    id: int
    user_id: int
    title: str
    hypothesis: str | None
    condition_a: str
    condition_b: str
    metric: ExperimentMetric
    status: Literal["active", "completed"]
    winner: ExperimentCondition | None
    completed_at: datetime | None
    created_at: datetime
    trial_count_a: int
    trial_count_b: int
    average_a: float | None
    average_b: float | None
    confidence_note: str
    trials: list[ExperimentTrialResponse]


class ExperimentInsight(BaseModel):
    title: str
    message: str
    next_action: str
    tone: Literal["neutral", "positive", "attention"]


class ExperimentWorkspaceResponse(BaseModel):
    total_experiments: int
    active_experiments: int
    completed_experiments: int
    total_trials: int
    most_successful_condition: str | None
    insight: ExperimentInsight
    experiments: list[ExperimentResponse]
