export type IfThenTriggerType = "time" | "routine" | "situation" | "emotion" | "location";
export type IfThenCategory = "productivity" | "focus" | "wellbeing" | "habit" | "study";
export type IfThenOutcome = "success" | "skip";

export type IfThenPlan = {
  id: number;
  user_id: number;
  trigger_type: IfThenTriggerType;
  trigger_text: string;
  action_text: string;
  category: IfThenCategory;
  note: string | null;
  is_active: boolean;
  success_count: number;
  skip_count: number;
  last_outcome: IfThenOutcome | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

export type IfThenPlanPayload = {
  trigger_type: IfThenTriggerType;
  trigger_text: string;
  action_text: string;
  category: IfThenCategory;
  note?: string | null;
};

export type IfThenWorkspace = {
  total_plans: number;
  active_plans: number;
  total_attempts: number;
  total_successes: number;
  success_rate: number;
  strongest_category: string | null;
  insight: {
    title: string;
    message: string;
    action: string;
    tone: "neutral" | "positive" | "attention";
  };
  plans: IfThenPlan[];
};
