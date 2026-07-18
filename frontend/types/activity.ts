export type ActivityKind =
  | "task"
  | "habit"
  | "focus"
  | "time_tracking"
  | "schedule"
  | "energy"
  | "movement"
  | "nourishment"
  | "recovery"
  | "distraction";

export type ActivityItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  description: string;
  occurred_at: string;
  duration_minutes: number | null;
  metadata: Record<string, string | number | boolean | null>;
};

export type ActivityTimeline = {
  items: ActivityItem[];
  summary: {
    total_events: number;
    active_days: number;
    tasks_completed: number;
    focus_minutes: number;
    tracked_minutes: number;
  };
  available_kinds: ActivityKind[];
};
