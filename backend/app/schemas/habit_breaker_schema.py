from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class JourneyBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: str = "other"; icon: str = "shield"; color: str = "#7c3aed"
    quit_at: datetime; birth_at: datetime | None = None
    why: list[str] = []; triggers: list[str] = []; strategy: str | None = None
    cost_per_occurrence: float = Field(default=0, ge=0)
    minutes_per_occurrence: int = Field(default=0, ge=0)
    occurrences_per_week: float = Field(default=0, ge=0)
class JourneyCreate(JourneyBase): pass
class JourneyUpdate(BaseModel):
    name: str | None = None; category: str | None = None; icon: str | None = None; color: str | None = None
    quit_at: datetime | None = None; birth_at: datetime | None = None; why: list[str] | None = None
    triggers: list[str] | None = None; strategy: str | None = None; cost_per_occurrence: float | None = None
    minutes_per_occurrence: int | None = None; occurrences_per_week: float | None = None; is_active: bool | None = None
class ResetCreate(BaseModel):
    note: str | None = Field(default=None, max_length=500)
    trigger: str | None = Field(default=None, max_length=120)
    reset_at: datetime | None = None
class RewardCreate(BaseModel): title: str = Field(min_length=1, max_length=120); target_days: int = Field(ge=1); estimated_cost: float = Field(default=0, ge=0)
class RewardUpdate(BaseModel): title: str | None = None; target_days: int | None = None; estimated_cost: float | None = None; purchased: bool | None = None
class JourneyResponse(JourneyBase):
    model_config = ConfigDict(from_attributes=True)
    id: int; is_active: bool; created_at: datetime; updated_at: datetime
class WorkspaceResponse(BaseModel): journeys: list[dict]; summary: dict; achievements: list[dict]; calendar: list[dict]; motivation: str
