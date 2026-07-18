from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

TriggerType = Literal["time", "routine", "situation", "emotion", "location"]
PlanCategory = Literal["productivity", "focus", "wellbeing", "habit", "study"]
PlanOutcome = Literal["success", "skip"]


class IfThenPlanCreate(BaseModel):
    trigger_type: TriggerType
    trigger_text: str = Field(min_length=2, max_length=220)
    action_text: str = Field(min_length=2, max_length=220)
    category: PlanCategory = "productivity"
    note: str | None = Field(default=None, max_length=500)


class IfThenPlanUpdate(BaseModel):
    trigger_type: TriggerType | None = None
    trigger_text: str | None = Field(default=None, min_length=2, max_length=220)
    action_text: str | None = Field(default=None, min_length=2, max_length=220)
    category: PlanCategory | None = None
    note: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None


class IfThenOutcomeCreate(BaseModel):
    outcome: PlanOutcome


class IfThenPlanResponse(BaseModel):
    id: int
    user_id: int
    trigger_type: TriggerType
    trigger_text: str
    action_text: str
    category: PlanCategory
    note: str | None
    is_active: bool
    success_count: int
    skip_count: int
    last_outcome: PlanOutcome | None
    last_used_at: datetime | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class IfThenInsight(BaseModel):
    title: str
    message: str
    action: str
    tone: Literal["neutral", "positive", "attention"]


class IfThenWorkspaceResponse(BaseModel):
    total_plans: int
    active_plans: int
    total_attempts: int
    total_successes: int
    success_rate: float
    strongest_category: str | None
    insight: IfThenInsight
    plans: list[IfThenPlanResponse]
