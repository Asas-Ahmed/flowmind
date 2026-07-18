from datetime import date, datetime

from pydantic import BaseModel


class DashboardStat(BaseModel):
    value: float
    label: str
    helper: str


class DashboardTaskItem(BaseModel):
    id: int
    title: str
    status: str
    eisenhower: str
    due_at: datetime | None


class DashboardHabitItem(BaseModel):
    id: int
    name: str
    color: str
    completed_today: bool
    progress: int


class DashboardScheduleItem(BaseModel):
    id: int
    title: str
    start_at: datetime
    end_at: datetime
    event_type: str
    color: str


class DashboardTrendPoint(BaseModel):
    date: date
    day: str
    score: int
    tasks_completed: int
    focus_minutes: int
    habits_completed: int


class DashboardInsight(BaseModel):
    title: str
    message: str
    tone: str
    action_label: str
    action_href: str


class DashboardResponse(BaseModel):
    user_name: str
    generated_at: datetime
    productivity_score: int
    score_change: int
    tasks_due_today: int
    overdue_tasks: int
    completed_today: int
    focus_minutes_today: int
    focus_goal_minutes: int
    habits_completed_today: int
    habits_due_today: int
    upcoming_count: int
    task_completion_rate: int
    habit_completion_rate: int
    focus_goal_rate: int
    priority_tasks: list[DashboardTaskItem]
    habits: list[DashboardHabitItem]
    upcoming_schedule: list[DashboardScheduleItem]
    weekly_trend: list[DashboardTrendPoint]
    insight: DashboardInsight
