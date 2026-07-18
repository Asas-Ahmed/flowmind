from datetime import datetime
from pydantic import BaseModel

class PatternEvidence(BaseModel):
    label: str
    value: str

class PersonalPattern(BaseModel):
    id: str
    title: str
    insight: str
    explanation: str
    confidence: str
    direction: str
    category: str
    sample_size: int
    evidence: list[PatternEvidence]
    action: str

class PersonalPatternsResponse(BaseModel):
    generated_at: datetime
    lookback_days: int
    confidence: str
    records_analyzed: int
    headline: str
    summary: str
    patterns: list[PersonalPattern]
    data_gaps: list[str]
    disclaimer: str
