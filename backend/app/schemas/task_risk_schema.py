from typing import Literal
from pydantic import BaseModel


class TaskRiskPrediction(BaseModel):
    task_id: int
    task_title: str
    completion_probability: float
    risk_probability: float
    risk_level: Literal["low", "medium", "high"]
    important_factors: list[str]
    recommended_action: str
    model_version: str
    completion_threshold: float


class TaskRiskWorkspace(BaseModel):
    predictions: list[TaskRiskPrediction]
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    model_version: str
