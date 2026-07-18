export type GoalType = "tasks" | "focus_minutes" | "habit_completions" | "tracked_minutes";

export type Goal = {
  id: number; title: string; goal_type: GoalType; target_value: number; color: string;
  is_active: boolean; created_at: string; updated_at: string; current_value: number;
  percentage: number; remaining_value: number; is_complete: boolean;
  display_current: string; display_target: string;
};

export type GoalsWorkspace = {
  summary: { total_goals: number; completed_goals: number; average_progress: number; week_start: string; week_end: string };
  goals: Goal[];
  suggestion: string;
};

export type GoalPayload = { title: string; goal_type: GoalType; target_value: number; color: string };
