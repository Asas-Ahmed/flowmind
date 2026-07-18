export type ScheduleEventType = "event" | "meeting" | "study" | "focus" | "personal";
export type ScheduleItemSource = "event" | "task" | "habit" | "focus";

export type ScheduleEvent = {
  id: number;
  user_id: number;
  task_id: number | null;
  title: string;
  description: string | null;
  event_type: ScheduleEventType;
  color: string;
  location: string | null;
  start_at: string;
  end_at: string;
  is_all_day: boolean;
  reminder_enabled: boolean;
  reminder_minutes_before: number;
  created_at: string;
  updated_at: string;
};

export type ScheduleEventPayload = Omit<
  ScheduleEvent,
  "id" | "user_id" | "created_at" | "updated_at"
>;

export type ScheduleItem = {
  id: string;
  source: ScheduleItemSource;
  source_id: number;
  title: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  is_all_day: boolean;
  color: string;
  status: string | null;
  reminder_at: string | null;
  location: string | null;
};

export type ScheduleDaySummary = {
  date: string;
  total: number;
  tasks: number;
  events: number;
  habits: number;
  focus: number;
};

export type ScheduleWorkspace = {
  range_start: string;
  range_end: string;
  items: ScheduleItem[];
  events: ScheduleEvent[];
  day_summaries: ScheduleDaySummary[];
  upcoming_count: number;
  today_count: number;
  overdue_count: number;
  reminder_count: number;
};

export type SmartScheduleRequest = {
  range_start: string;
  range_end: string;
  workday_start_hour: number;
  workday_end_hour: number;
  slot_minutes: number;
  break_minutes: number;
  max_items: number;
  include_weekends: boolean;
  timezone_offset_minutes: number;
};

export type SmartScheduleSuggestion = {
  task_id: number;
  task_title: string;
  start_at: string;
  end_at: string;
  duration_minutes: number;
  score: number;
  priority_label: string;
  energy_level: string;
  due_at: string | null;
  reason: string;
  warning: string | null;
};

export type SmartScheduleResponse = {
  suggestions: SmartScheduleSuggestion[];
  unscheduled_task_count: number;
  scheduled_minutes: number;
  remaining_task_count: number;
  explanation: string;
};

export type SmartScheduleApplyResponse = {
  created_events: ScheduleEvent[];
  created_count: number;
  skipped_count: number;
};
