export type TimeProject = {
  id: number;
  user_id: number;
  name: string;
  color: string;
  is_archived: boolean;
  created_at: string;
};

export type TimeEntry = {
  id: number;
  user_id: number;
  project_id: number | null;
  description: string;
  tags: string[];
  is_billable: boolean;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  source: "timer" | "manual";
  note: string | null;
  created_at: string;
  updated_at: string;
  project: TimeProject | null;
};

export type TimeBreakdownItem = {
  label: string;
  seconds: number;
  percentage: number;
  color: string | null;
};

export type DailyTimeTotal = { date: string; seconds: number };

export type TimeTrackingWorkspace = {
  active_entry: TimeEntry | null;
  today_seconds: number;
  week_seconds: number;
  billable_week_seconds: number;
  average_daily_seconds: number;
  entries_this_week: number;
  projects: TimeProject[];
  project_breakdown: TimeBreakdownItem[];
  tag_breakdown: TimeBreakdownItem[];
  daily_totals: DailyTimeTotal[];
  insight: {
    title: string;
    message: string;
    recommendation: string;
    tone: "neutral" | "positive" | "attention";
  };
  entries: TimeEntry[];
};

export type TimerStartPayload = {
  description: string;
  project_id: number | null;
  tags: string[];
  is_billable: boolean;
  note?: string | null;
};

export type ManualTimeEntryPayload = TimerStartPayload & {
  started_at: string;
  ended_at: string;
};

export type TimeEntryUpdatePayload = Partial<ManualTimeEntryPayload>;
