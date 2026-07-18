export type ExperimentMetric =
  | "focus_rating"
  | "productivity_score"
  | "completion_quality"
  | "energy_after";

export type ExperimentCondition = "A" | "B";

export type ExperimentTrial = {
  id: number;
  experiment_id: number;
  condition: ExperimentCondition;
  score: number;
  note: string | null;
  recorded_at: string;
};

export type ProductivityExperiment = {
  id: number;
  user_id: number;
  title: string;
  hypothesis: string | null;
  condition_a: string;
  condition_b: string;
  metric: ExperimentMetric;
  status: "active" | "completed";
  winner: ExperimentCondition | null;
  completed_at: string | null;
  created_at: string;
  trial_count_a: number;
  trial_count_b: number;
  average_a: number | null;
  average_b: number | null;
  confidence_note: string;
  trials: ExperimentTrial[];
};

export type ExperimentPayload = {
  title: string;
  hypothesis?: string | null;
  condition_a: string;
  condition_b: string;
  metric: ExperimentMetric;
};

export type ExperimentTrialPayload = {
  condition: ExperimentCondition;
  score: number;
  note?: string | null;
};

export type ExperimentWorkspace = {
  total_experiments: number;
  active_experiments: number;
  completed_experiments: number;
  total_trials: number;
  most_successful_condition: string | null;
  insight: {
    title: string;
    message: string;
    next_action: string;
    tone: "neutral" | "positive" | "attention";
  };
  experiments: ProductivityExperiment[];
};
