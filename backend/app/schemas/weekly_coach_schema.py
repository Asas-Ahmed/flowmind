from datetime import date, datetime

from pydantic import BaseModel


class CoachSignal(BaseModel):
    title: str
    detail: str
    evidence: str
    tone: str


class CoachAction(BaseModel):
    title: str
    detail: str
    priority: str
    action_label: str
    action_href: str


class CoachExperiment(BaseModel):
    hypothesis: str
    method: str
    success_measure: str


class WeeklyCoachResponse(BaseModel):
    period_start: date
    period_end: date
    generated_at: datetime
    headline: str
    summary: str
    confidence: str
    score: int
    strengths: list[CoachSignal]
    friction: list[CoachSignal]
    actions: list[CoachAction]
    experiment: CoachExperiment
    reflection_questions: list[str]
    disclaimer: str
