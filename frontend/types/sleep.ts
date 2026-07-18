export type SleepQuality = 1 | 2 | 3 | 4 | 5;

export type SleepRecord = {
  id: number;
  user_id: number;
  sleep_date: string;
  bedtime: string;
  wake_time: string;
  duration_hours: number;
  quality: SleepQuality;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type SleepTrendPoint = {
  date: string;
  duration_hours: number;
  quality: number;
  bedtime_minutes: number | null;
  wake_minutes: number | null;
  has_record: boolean;
};

export type SleepInsight = {
  key: string;
  title: string;
  message: string;
  action: string;
  tone: "steady" | "attention" | "positive" | "neutral";
};

export type SleepWorkspace = {
  latest_record: SleepRecord | null;
  average_duration: number;
  average_quality: number;
  bedtime_variation_minutes: number;
  wake_variation_minutes: number;
  consistency_score: number;
  weekly_records: number;
  insight: SleepInsight;
  trend_points: SleepTrendPoint[];
  recent_records: SleepRecord[];
};

export type SleepRecordPayload = {
  sleep_date: string;
  bedtime: string;
  wake_time: string;
  quality: SleepQuality;
  note?: string | null;
};
