export type MovementRoutine =
  | "full_body"
  | "shoulders_neck"
  | "wrists_hands"
  | "walk_water"
  | "posture_reset";

export type MovementBreakStatus = "completed" | "skipped";

export type MovementBreak = {
  id: number;
  user_id: number;
  routine: MovementRoutine;
  status: MovementBreakStatus;
  duration_seconds: number;
  trigger_focus_sessions: number;
  completed_at: string;
  created_at: string;
};

export type MovementDailyPoint = {
  date: string;
  completed: number;
  minutes: number;
};

export type MovementWorkspace = {
  break_due: boolean;
  focus_sessions_since_break: number;
  sessions_until_break: number;
  today_completed: number;
  today_minutes: number;
  weekly_completed: number;
  current_streak: number;
  best_streak: number;
  completion_rate: number;
  recent_breaks: MovementBreak[];
  daily_points: MovementDailyPoint[];
};

export type MovementBreakPayload = {
  routine: MovementRoutine;
  status: MovementBreakStatus;
  duration_seconds: number;
};
