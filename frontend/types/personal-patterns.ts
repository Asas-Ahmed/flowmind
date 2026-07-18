export type PatternEvidence = { label: string; value: string };
export type PersonalPattern = {
  id: string; title: string; insight: string; explanation: string;
  confidence: string; direction: "positive" | "warning" | "neutral";
  category: string; sample_size: number; evidence: PatternEvidence[]; action: string;
};
export type PersonalPatternsWorkspace = {
  generated_at: string; lookback_days: number; confidence: string; records_analyzed: number;
  headline: string; summary: string; patterns: PersonalPattern[]; data_gaps: string[]; disclaimer: string;
};
