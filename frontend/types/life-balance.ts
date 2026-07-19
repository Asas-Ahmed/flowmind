export type LifeBalanceStatus = "thriving" | "steady" | "needs-care" | "priority" | "unchecked";

export type LifeBalanceArea = {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  score: number;
  previous_score: number | null;
  trend: number;
  status: LifeBalanceStatus;
  last_checkin: string | null;
  note: string | null;
  next_action: string;
  suggestions: string[];
};

export type LifeBalanceCheckIn = {
  id: number;
  area_key: string;
  score: number;
  note: string | null;
  next_action: string | null;
  checkin_date: string;
  created_at: string;
  updated_at: string;
};

export type LifeBalanceWorkspace = {
  summary: {
    overall_score: number;
    checked_areas: number;
    total_areas: number;
    strong_areas: number;
    attention_areas: number;
    current_streak: number;
    last_checkin: string | null;
  };
  areas: LifeBalanceArea[];
  priority_areas: string[];
  assistant_message: string;
  weekly_challenge: string;
  history: LifeBalanceCheckIn[];
};

export type LifeBalanceCheckInPayload = {
  area_key: string;
  score: number;
  note?: string | null;
  next_action?: string | null;
  checkin_date?: string;
};
