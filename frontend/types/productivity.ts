export type ProductivityComponent = {
  key: "tasks" | "habits" | "focus";
  label: string;
  score: number;
  weight: number;
  weighted_points: number;
  current: number;
  target: number;
  unit: string;
  explanation: string;
  action_label: string;
  action_href: string;
};

export type ProductivityTrendPoint = {
  date: string;
  day: string;
  score: number;
  tasks: number;
  habits: number;
  focus_minutes: number;
  overdue_penalty: number;
};

export type ProductivityRecommendation = {
  title: string;
  message: string;
  priority: "high" | "medium" | "low" | "positive";
  action_label: string;
  action_href: string;
};

export type ProductivityData = {
  generated_at: string;
  score: number;
  previous_score: number;
  score_change: number;
  level: string;
  summary: string;
  data_confidence: string;
  active_days: number;
  overdue_tasks: number;
  overdue_penalty: number;
  components: ProductivityComponent[];
  trend: ProductivityTrendPoint[];
  recommendations: ProductivityRecommendation[];
};
