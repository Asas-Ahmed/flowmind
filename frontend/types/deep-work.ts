export type DeepWorkDailyPoint = {
  date: string;
  label: string;
  minutes: number;
  sessions: number;
  interruptions: number;
  score: number;
};

export type DeepWorkSessionBand = {
  label: string;
  range_label: string;
  sessions: number;
  total_minutes: number;
  completion_rate: number;
};

export type DeepWorkInsight = {
  title: string;
  message: string;
  action_label: string;
  action_href: string;
  tone: "positive" | "neutral" | "attention";
};

export type DeepWorkWorkspace = {
  score: number;
  score_label: string;
  weekly_minutes: number;
  previous_week_minutes: number;
  weekly_change: number | null;
  completed_sessions: number;
  average_session_minutes: number;
  longest_session_minutes: number;
  interruptions: number;
  interruption_minutes: number;
  average_recovery_minutes: number;
  uninterrupted_rate: number;
  best_focus_hour: number | null;
  best_focus_window: string | null;
  daily_points: DeepWorkDailyPoint[];
  session_bands: DeepWorkSessionBand[];
  insight: DeepWorkInsight;
};
