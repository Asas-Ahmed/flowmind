export type FocusMode = "focus" | "short_break" | "long_break";
export type FocusStatus = "active" | "paused" | "completed" | "cancelled";

export type FocusSession = {
  id: number;
  user_id: number;
  task_id: number | null;
  title: string;
  mode: FocusMode;
  status: FocusStatus;
  planned_minutes: number;
  elapsed_seconds: number;
  started_at: string;
  paused_at: string | null;
  completed_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type FocusDailyPoint = {
  date: string;
  minutes: number;
  sessions: number;
};

export type FocusDurationProfile = {
  minutes: number;
  label: string;
  sessions: number;
  completed_sessions: number;
  completion_rate: number;
  average_progress: number;
  performance_score: number;
};

export type AdaptiveFocusRecommendation = {
  recommended_minutes: number;
  confidence: "learning" | "emerging" | "strong";
  sample_size: number;
  message: string;
  profiles: FocusDurationProfile[];
};

export type FocusWorkspace = {
  active_session: FocusSession | null;
  recent_sessions: FocusSession[];
  today_minutes: number;
  today_sessions: number;
  weekly_minutes: number;
  weekly_sessions: number;
  completion_rate: number;
  current_streak: number;
  best_streak: number;
  daily_goal_minutes: number;
  daily_points: FocusDailyPoint[];
  adaptive_recommendation: AdaptiveFocusRecommendation;
};

export type FocusSessionPayload = {
  title: string;
  task_id: number | null;
  mode: FocusMode;
  planned_minutes: number;
};
