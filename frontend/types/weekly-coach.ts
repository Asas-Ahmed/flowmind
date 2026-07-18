export type CoachSignal = { title: string; detail: string; evidence: string; tone: string };
export type CoachAction = { title: string; detail: string; priority: string; action_label: string; action_href: string };
export type WeeklyCoach = {
  period_start: string;
  period_end: string;
  generated_at: string;
  headline: string;
  summary: string;
  confidence: string;
  score: number;
  strengths: CoachSignal[];
  friction: CoachSignal[];
  actions: CoachAction[];
  experiment: { hypothesis: string; method: string; success_measure: string };
  reflection_questions: string[];
  disclaimer: string;
};
