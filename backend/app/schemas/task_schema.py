from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

TaskStatus = Literal["not_started", "in_progress", "waiting", "completed"]
Eisenhower = Literal[
    "urgent_important",
    "important_not_urgent",
    "urgent_not_important",
    "not_urgent_not_important",
]
EnergyLevel = Literal["low", "medium", "high"]
RepeatRule = Literal["none", "daily", "weekdays", "weekly", "monthly", "yearly"]


class SubtaskItem(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=160)
    completed: bool = False

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        return " ".join(value.strip().split())


class TaskBase(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=5000)
    list_id: int | None = None
    category_id: int | None = None
    status: TaskStatus = "not_started"
    eisenhower: Eisenhower = "important_not_urgent"
    energy_level: EnergyLevel = "medium"
    start_at: datetime | None = None
    due_at: datetime | None = None
    is_all_day: bool = False
    repeat_rule: RepeatRule = "none"
    repeat_interval: int = Field(default=1, ge=1, le=365)
    repeat_until: datetime | None = None
    reminder_enabled: bool = False
    reminder_at: datetime | None = None
    tags: list[str] = Field(default_factory=list, max_length=12)
    subtasks: list[SubtaskItem] = Field(default_factory=list, max_length=50)

    @field_validator("title")
    @classmethod
    def clean_title(cls, value: str) -> str:
        return " ".join(value.strip().split())

    @field_validator("tags")
    @classmethod
    def clean_tags(cls, values: list[str]) -> list[str]:
        result: list[str] = []
        for value in values:
            tag = value.strip().lower().lstrip("#")[:40]
            if tag and tag not in result:
                result.append(tag)
        return result

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_at and self.due_at and self.due_at < self.start_at:
            raise ValueError("Due date cannot be earlier than the start date")
        if self.repeat_until and self.due_at and self.repeat_until < self.due_at:
            raise ValueError("Repeat end cannot be earlier than the due date")
        if self.reminder_enabled and not self.reminder_at:
            raise ValueError("Reminder time is required when reminders are enabled")
        return self


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=5000)
    list_id: int | None = None
    category_id: int | None = None
    status: TaskStatus | None = None
    eisenhower: Eisenhower | None = None
    energy_level: EnergyLevel | None = None
    start_at: datetime | None = None
    due_at: datetime | None = None
    is_all_day: bool | None = None
    repeat_rule: RepeatRule | None = None
    repeat_interval: int | None = Field(default=None, ge=1, le=365)
    repeat_until: datetime | None = None
    reminder_enabled: bool | None = None
    reminder_at: datetime | None = None
    tags: list[str] | None = Field(default=None, max_length=12)
    subtasks: list[SubtaskItem] | None = Field(default=None, max_length=50)


class TaskResponse(TaskBase):
    id: int
    user_id: int
    reminder_sent: bool
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class TaskListCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    color: str = Field(default="#4a6ded", pattern=r"^#[0-9a-fA-F]{6}$")
    icon: str = Field(default="list", max_length=40)


class TaskListResponse(TaskListCreate):
    id: int
    user_id: int
    is_default: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    color: str = Field(default="#762bbc", pattern=r"^#[0-9a-fA-F]{6}$")


class CategoryResponse(CategoryCreate):
    id: int
    user_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class TaskWorkspaceResponse(BaseModel):
    tasks: list[TaskResponse]
    lists: list[TaskListResponse]
    categories: list[CategoryResponse]
