export type WeeklyMetric = { label: string; value: number; display_value: string; change: number | null; change_label: string | null };
export type WeeklyDay = { date: string; label: string; tasks_completed: number; focus_minutes: number; tracked_minutes: number; habit_completions: number; score: number };
export type WeeklyReview = {
  period_start: string; period_end: string; generated_at: string; score: number; score_label: string;
  metrics: WeeklyMetric[]; daily_breakdown: WeeklyDay[]; strengths: string[]; watchouts: string[];
  insight: { title: string; message: string; tone: string; action_label: string; action_href: string };
  best_day: string | null; most_productive_window: string | null; biggest_distraction: string | null;
  average_sleep_hours: number | null; average_energy: number | null;
};
