from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

EnergyLevel = Literal[1, 2, 3]
StressLevel = Literal[1, 2, 3]
FocusLevel = Literal[1, 2, 3]


class EnergyCheckInCreate(BaseModel):
    energy_level: EnergyLevel
    stress_level: StressLevel
    focus_level: FocusLevel
    note: str | None = Field(default=None, max_length=500)


class EnergyCheckInResponse(BaseModel):
    id: int
    user_id: int
    energy_level: EnergyLevel
    stress_level: StressLevel
    focus_level: FocusLevel
    note: str | None
    recommendation_key: str
    checked_at: datetime
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class EnergyTrendPoint(BaseModel):
    date: date
    energy: float
    stress: float
    focus: float
    checkins: int


class EnergyRecommendation(BaseModel):
    key: str
    title: str
    message: str
    action: str
    tone: Literal["calm", "focus", "recovery", "momentum"]


class EnergyWorkspaceResponse(BaseModel):
    latest_checkin: EnergyCheckInResponse | None
    recommendation: EnergyRecommendation
    today_checkins: int
    weekly_checkins: int
    average_energy: float
    average_stress: float
    average_focus: float
    strongest_state: str
    trend_points: list[EnergyTrendPoint]
    recent_checkins: list[EnergyCheckInResponse]
