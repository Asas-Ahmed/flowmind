export type RecoveryBreakType = "breathing" | "stretching" | "eye_care" | "water" | "quiet_rest" | "short_walk";
export type RecoveryFeedback = "better" | "same" | "worse";

export type RecoveryBreak = {
  id: number;
  user_id: number;
  break_type: RecoveryBreakType;
  duration_minutes: number;
  feedback: RecoveryFeedback;
  note: string | null;
  completed_at: string;
  created_at: string;
};

export type RecoveryBreakPayload = {
  break_type: RecoveryBreakType;
  duration_minutes: number;
  feedback: RecoveryFeedback;
  note?: string;
};

export type RecoveryWorkspace = {
  today_breaks: number;
  today_minutes: number;
  weekly_breaks: number;
  weekly_minutes: number;
  helpful_rate: number;
  current_streak: number;
  recommended_type: RecoveryBreakType;
  assistant_title: string;
  assistant_message: string;
  recent_breaks: RecoveryBreak[];
  daily_points: { date: string; breaks: number; helpful_breaks: number; minutes: number }[];
  type_stats: { break_type: RecoveryBreakType; sessions: number; helpful_rate: number }[];
};
