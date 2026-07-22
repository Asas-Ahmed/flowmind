export type TaskRiskLevel = "low" | "medium" | "high";

export type TaskRiskPrediction = {
  task_id: number;
  completion_probability: number;
  risk_probability: number;
  risk_level: TaskRiskLevel;
  important_factors: string[];
  recommended_action: string;
  model_version: string;
  completion_threshold: number;
};

export type TaskRiskWorkspace = {
  predictions: TaskRiskPrediction[];
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  model_version: string;
};
