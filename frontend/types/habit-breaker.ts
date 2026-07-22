export type QuitReward = {
  id: number;
  title: string;
  target_days: number;
  estimated_cost: number;
  purchased: boolean;
  unlocked: boolean;
};

export type QuitAchievement = {
  days: number;
  title: string;
  icon: string;
  category: string;
  unlocked: boolean;
  progress: number;
};

export type QuitJourney = {
  id: number;
  name: string;
  category: string;
  icon: string;
  color: string;
  quit_at: string;
  birth_at: string | null;
  why: string[];
  triggers: string[];
  strategy: string | null;
  is_active: boolean;
  current_seconds: number;
  current_days: number;
  longest_days: number;
  shortest_days: number;
  average_days: number;
  previous_days: number;
  reset_count: number;
  money_saved: number;
  time_saved_minutes: number;
  rewards: QuitReward[];
  rewards_bought: number;
  next_milestone: {
    days: number;
    title: string;
    icon: string;
    category: string;
    remaining_days: number;
  } | null;
};

export type HabitBreakerWorkspace = {
  journeys: QuitJourney[];
  summary: {
    active: number;
    total_resets: number;
    best_days: number;
    money_saved: number;
    time_saved_minutes: number;
    rewards_bought: number;
    total_rewards: number;
    unlocked_rewards: number;
  };
  achievements: QuitAchievement[];
  calendar: {
    date: string;
    type: string;
    journey_id: number;
    note: string | null;
    trigger: string | null;
  }[];
  motivation: string;
};

export type JourneyPayload = {
  name: string;
  category: string;
  icon: string;
  color: string;
  quit_at: string;
  birth_at: string | null;
  why: string[];
  triggers: string[];
  strategy: string;
  cost_per_occurrence: number;
  minutes_per_occurrence: number;
  occurrences_per_week: number;
};
