export type DashboardTaskItem = {
  id: number;
  title: string;
  status: string;
  eisenhower: string;
  due_at: string | null;
};

export type DashboardHabitItem = {
  id: number;
  name: string;
  color: string;
  completed_today: boolean;
  progress: number;
};

export type DashboardScheduleItem = {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  event_type: string;
  color: string;
};

export type DashboardTrendPoint = {
  date: string;
  day: string;
  score: number;
  tasks_completed: number;
  focus_minutes: number;
  habits_completed: number;
};

export type DashboardInsight = {
  title: string;
  message: string;
  tone: "warning" | "focus" | "habit" | "positive";
  action_label: string;
  action_href: string;
};

export type DashboardData = {
  user_name: string;
  generated_at: string;
  productivity_score: number;
  score_change: number;
  active_tasks: number;
  active_habits: number;
  tasks_due_today: number;
  overdue_tasks: number;
  completed_today: number;
  focus_minutes_today: number;
  focus_goal_minutes: number;
  habits_completed_today: number;
  habits_due_today: number;
  upcoming_count: number;
  task_completion_rate: number;
  habit_completion_rate: number;
  focus_goal_rate: number;
  priority_tasks: DashboardTaskItem[];
  habits: DashboardHabitItem[];
  upcoming_schedule: DashboardScheduleItem[];
  weekly_trend: DashboardTrendPoint[];
  insight: DashboardInsight;
};
