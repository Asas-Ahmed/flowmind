export type NourishmentKind = "water" | "meal";
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type NourishmentLog = {
  id: number;
  user_id: number;
  kind: NourishmentKind;
  amount_ml: number | null;
  meal_type: MealType | null;
  note: string | null;
  logged_at: string;
  created_at: string;
};

export type NourishmentLogPayload = {
  kind: NourishmentKind;
  amount_ml?: number;
  meal_type?: MealType;
  note?: string;
};

export type NourishmentWorkspace = {
  water_target_ml: number;
  today_water_ml: number;
  water_progress: number;
  today_meals: number;
  meals_progress: number;
  hydration_due: boolean;
  meal_due: boolean;
  current_streak: number;
  weekly_water_average_ml: number;
  weekly_meal_average: number;
  assistant_title: string;
  assistant_message: string;
  recent_logs: NourishmentLog[];
  daily_points: { date: string; water_ml: number; meals: number }[];
};
