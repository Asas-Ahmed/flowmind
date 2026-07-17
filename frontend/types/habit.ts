export type HabitFrequency = "daily" | "weekdays" | "weekly" | "custom";
export type HabitCategory =
  | "health"
  | "study"
  | "work"
  | "mindfulness"
  | "fitness"
  | "personal";

export type Habit = {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  category: HabitCategory;
  color: string;
  icon: string;
  frequency: HabitFrequency;
  scheduled_days: number[];
  target_count: number;
  unit: string;
  reminder_enabled: boolean;
  reminder_time: string | null;
  start_date: string;
  end_date: string | null;
  is_archived: boolean;
  current_streak: number;
  best_streak: number;
  completed_today: boolean;
  today_count: number;
  completion_rate: number;
  created_at: string;
  updated_at: string;
};

export type HabitCompletion = {
  id: number;
  habit_id: number;
  completion_date: string;
  count: number;
  note: string | null;
  completed_at: string;
};

export type HabitWorkspace = {
  habits: Habit[];
  completions: HabitCompletion[];
  today_completed: number;
  today_total: number;
  weekly_rate: number;
  longest_streak: number;
};

export type HabitPayload = Omit<
  Habit,
  | "id"
  | "user_id"
  | "current_streak"
  | "best_streak"
  | "completed_today"
  | "today_count"
  | "completion_rate"
  | "created_at"
  | "updated_at"
>;
