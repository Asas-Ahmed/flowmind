export type BurnoutRiskLevel = "low" | "moderate" | "high";
export type BurnoutSignalTone = "positive" | "neutral" | "attention" | "high";

export type BurnoutSignal = {
  key: string;
  title: string;
  value: string;
  detail: string;
  score: number;
  max_score: number;
  tone: BurnoutSignalTone;
};

export type BurnoutRecommendation = {
  title: string;
  detail: string;
  action: string;
  priority: "now" | "today" | "this_week";
};

export type BurnoutWorkspace = {
  risk_score: number;
  risk_level: BurnoutRiskLevel;
  headline: string;
  summary: string;
  disclaimer: string;
  protective_factors: number;
  warning_signals: number;
  data_coverage: number;
  signals: BurnoutSignal[];
  recommendations: BurnoutRecommendation[];
  trend: Array<{ date: string; workload: number; recovery: number }>;
};
