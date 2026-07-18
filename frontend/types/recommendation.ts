export type RecommendationPriority = "high" | "medium" | "low";
export type RecommendationConfidence = "high" | "medium" | "early";
export type RecommendationImpact = "focus" | "planning" | "wellbeing" | "consistency";

export type RecommendationEvidence = {
  label: string;
  value: string;
};

export type ProductivityRecommendation = {
  id: string;
  title: string;
  message: string;
  reason: string;
  category: string;
  priority: RecommendationPriority;
  confidence: RecommendationConfidence;
  impact: RecommendationImpact;
  evidence: RecommendationEvidence[];
  action: {
    label: string;
    href: string;
  };
};

export type RecommendationWorkspace = {
  generated_at: string;
  horizon_days: number;
  headline: string;
  summary: string;
  readiness_score: number;
  signals_analyzed: number;
  high_priority_count: number;
  recommendations: ProductivityRecommendation[];
  data_gaps: string[];
  disclaimer: string;
};
