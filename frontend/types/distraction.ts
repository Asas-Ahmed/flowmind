export type DistractionType =
  | "phone"
  | "social_media"
  | "noise"
  | "messages"
  | "hunger"
  | "tiredness"
  | "thoughts"
  | "other";

export type DistractionContext = "focus" | "study" | "work" | "task" | "break" | "other";

export type DistractionLog = {
  id: number;
  user_id: number;
  distraction_type: DistractionType;
  context: DistractionContext;
  intensity: number;
  minutes_lost: number;
  recovery_action: string | null;
  note: string | null;
  occurred_at: string;
  created_at: string;
};

export type DistractionPayload = {
  distraction_type: DistractionType;
  context: DistractionContext;
  intensity: number;
  minutes_lost: number;
  recovery_action?: string | null;
  note?: string | null;
  occurred_at?: string | null;
};

export type DistractionWorkspace = {
  total_logs: number;
  logs_this_week: number;
  minutes_lost_this_week: number;
  most_common_distraction: DistractionType | null;
  peak_hour: number | null;
  breakdown: Array<{
    distraction_type: DistractionType;
    count: number;
    percentage: number;
  }>;
  insight: {
    title: string;
    message: string;
    experiment: string;
    tone: "neutral" | "positive" | "attention";
  };
  logs: DistractionLog[];
};
