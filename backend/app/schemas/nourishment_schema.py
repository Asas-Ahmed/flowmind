from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

NourishmentKind = Literal["water", "meal"]
MealType = Literal["breakfast", "lunch", "dinner", "snack"]


class NourishmentLogCreate(BaseModel):
    kind: NourishmentKind
    amount_ml: int | None = Field(default=None, ge=50, le=2000)
    meal_type: MealType | None = None
    note: str | None = Field(default=None, max_length=180)

    @model_validator(mode="after")
    def validate_kind_details(self):
        if self.kind == "water" and self.amount_ml is None:
            raise ValueError("Water logs require an amount")
        if self.kind == "meal" and self.meal_type is None:
            raise ValueError("Meal logs require a meal type")
        return self


class NourishmentLogResponse(BaseModel):
    id: int
    user_id: int
    kind: NourishmentKind
    amount_ml: int | None
    meal_type: MealType | None
    note: str | None
    logged_at: datetime
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class NourishmentDailyPoint(BaseModel):
    date: date
    water_ml: int
    meals: int


class NourishmentWorkspaceResponse(BaseModel):
    water_target_ml: int
    today_water_ml: int
    water_progress: float
    today_meals: int
    meals_progress: float
    hydration_due: bool
    meal_due: bool
    current_streak: int
    weekly_water_average_ml: int
    weekly_meal_average: float
    assistant_title: str
    assistant_message: str
    recent_logs: list[NourishmentLogResponse]
    daily_points: list[NourishmentDailyPoint]
