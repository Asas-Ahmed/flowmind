export type StarterTechnique =
  | "two_minute_rule"
  | "smallest_step"
  | "timebox"
  | "remove_friction"
  | "easy_entry";

export type ProcrastinationStarter = {
  id: number;
  user_id: number;
  task_name: string;
  obstacle: string | null;
  technique: StarterTechnique;
  first_step: string;
  starter_minutes: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
};

export type ProcrastinationStarterPayload = {
  task_name: string;
  obstacle?: string | null;
  technique: StarterTechnique;
  first_step: string;
  starter_minutes: number;
};

export type ProcrastinationWorkspace = {
  total_starters: number;
  completed_starters: number;
  completion_rate: number;
  active_starters: number;
  most_used_technique: StarterTechnique | null;
  insight: {
    title: string;
    message: string;
    next_action: string;
    tone: "neutral" | "positive" | "attention";
  };
  starters: ProcrastinationStarter[];
};
