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
};

export type FocusSessionPayload = {
  title: string;
  task_id: number | null;
  mode: FocusMode;
  planned_minutes: number;
};
