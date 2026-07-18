export type CognitiveDifficulty = "light" | "moderate" | "deep";

export type CognitiveLoadEntry = {
  id: number;
  user_id: number;
  entry_date: string;
  title: string;
  difficulty: CognitiveDifficulty;
  estimated_minutes: number;
  note: string | null;
  created_at: string;
};

export type CognitiveLoadDayPoint = {
  date: string;
  score: number;
  light_count: number;
  moderate_count: number;
  deep_count: number;
};

export type CognitiveLoadInsight = {
  key: string;
  title: string;
  message: string;
  action: string;
  tone: "balanced" | "attention" | "positive" | "neutral";
};

export type CognitiveLoadWorkspace = {
  today_score: number;
  capacity_score: number;
  load_level: "empty" | "light" | "balanced" | "high" | "overloaded";
  today_entries: number;
  light_count: number;
  moderate_count: number;
  deep_count: number;
  estimated_minutes: number;
  weekly_average: number;
  insight: CognitiveLoadInsight;
  week_points: CognitiveLoadDayPoint[];
  recent_entries: CognitiveLoadEntry[];
};

export type CognitiveLoadEntryPayload = {
  entry_date: string;
  title: string;
  difficulty: CognitiveDifficulty;
  estimated_minutes: number;
  note?: string | null;
};
