export type ProductivityHeatmapDay = {
  date: string;
  score: number;
  level: number;
  tasks_completed: number;
  focus_minutes: number;
  habit_completions: number;
  energy_average: number | null;
  sleep_hours: number | null;
  sleep_quality: number | null;
};

export type ProductivityHeatmapWorkspace = {
  year: number;
  available_years: number[];
  days: ProductivityHeatmapDay[];
  summary: {
    active_days: number;
    total_days: number;
    average_score: number;
    best_score: number;
    best_date: string | null;
    current_streak: number;
    longest_streak: number;
    total_tasks: number;
    total_focus_minutes: number;
    total_habits: number;
  };
  insight: { title: string; message: string };
};
