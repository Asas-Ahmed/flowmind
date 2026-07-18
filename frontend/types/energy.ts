export type CheckInLevel = 1 | 2 | 3;

export type EnergyCheckIn = {
  id: number;
  user_id: number;
  energy_level: CheckInLevel;
  stress_level: CheckInLevel;
  focus_level: CheckInLevel;
  note: string | null;
  recommendation_key: string;
  checked_at: string;
  created_at: string;
};

export type EnergyTrendPoint = {
  date: string;
  energy: number;
  stress: number;
  focus: number;
  checkins: number;
};

export type EnergyRecommendation = {
  key: string;
  title: string;
  message: string;
  action: string;
  tone: "calm" | "focus" | "recovery" | "momentum";
};

export type EnergyWorkspace = {
  latest_checkin: EnergyCheckIn | null;
  recommendation: EnergyRecommendation;
  today_checkins: number;
  weekly_checkins: number;
  average_energy: number;
  average_stress: number;
  average_focus: number;
  strongest_state: string;
  trend_points: EnergyTrendPoint[];
  recent_checkins: EnergyCheckIn[];
};

export type EnergyCheckInPayload = {
  energy_level: CheckInLevel;
  stress_level: CheckInLevel;
  focus_level: CheckInLevel;
  note?: string | null;
};
