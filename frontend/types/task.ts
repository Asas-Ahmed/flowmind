export type TaskStatus = "not_started" | "in_progress" | "waiting" | "completed";
export type EisenhowerPriority =
  | "urgent_important"
  | "important_not_urgent"
  | "urgent_not_important"
  | "not_urgent_not_important";
export type EnergyLevel = "low" | "medium" | "high";
export type RepeatRule = "none" | "daily" | "weekdays" | "weekly" | "monthly" | "yearly";

export type Subtask = { id: string; title: string; completed: boolean };

export type Task = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  list_id: number | null;
  category_id: number | null;
  status: TaskStatus;
  eisenhower: EisenhowerPriority;
  energy_level: EnergyLevel;
  start_at: string | null;
  due_at: string | null;
  is_all_day: boolean;
  repeat_rule: RepeatRule;
  repeat_interval: number;
  repeat_until: string | null;
  reminder_enabled: boolean;
  reminder_at: string | null;
  reminder_sent: boolean;
  tags: string[];
  subtasks: Subtask[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskList = {
  id: number;
  user_id: number;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
  created_at: string;
};

export type TaskCategory = {
  id: number;
  user_id: number;
  name: string;
  color: string;
  created_at: string;
};

export type TaskWorkspace = {
  tasks: Task[];
  lists: TaskList[];
  categories: TaskCategory[];
};

export type TaskPayload = Omit<
  Task,
  "id" | "user_id" | "reminder_sent" | "completed_at" | "created_at" | "updated_at"
>;
