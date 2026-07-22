import type { HabitBreakerWorkspace, JourneyPayload, QuitJourney } from "@/types/habit-breaker";
import type { LifeBalanceCheckIn, LifeBalanceCheckInPayload, LifeBalanceWorkspace } from "@/types/life-balance";
import type { Goal, GoalPayload, GoalsWorkspace } from "@/types/goals";
import type { ProductivityHeatmapWorkspace } from "@/types/productivity-heatmap";
import type { DeepWorkWorkspace } from "@/types/deep-work";
import type { WeeklyReview } from "@/types/weekly-review";
import type { WeeklyCoach } from "@/types/weekly-coach";
import type { ActivityTimeline } from "@/types/activity";
import type {
  ManualTimeEntryPayload,
  TimeEntry,
  TimeEntryUpdatePayload,
  TimeProject,
  TimeTrackingWorkspace,
  TimerStartPayload,
  WorkCategory,
} from "@/types/time-tracking";
import type { RecoveryBreak, RecoveryBreakPayload, RecoveryWorkspace } from "@/types/recovery";
import type { NourishmentLog, NourishmentLogPayload, NourishmentWorkspace } from "@/types/nourishment";
import type { BurnoutWorkspace } from "@/types/burnout";
import type {
  ExperimentPayload,
  ExperimentTrialPayload,
  ExperimentWorkspace,
  ProductivityExperiment,
} from "@/types/experiment";
import type { DashboardData } from "@/types/dashboard";
import type {
  ProcrastinationStarter,
  ProcrastinationStarterPayload,
  ProcrastinationWorkspace,
} from "@/types/procrastination";
import type {
  IfThenOutcome,
  IfThenPlan,
  IfThenPlanPayload,
  IfThenWorkspace,
} from "@/types/if-then";
import type {
  DistractionLog,
  DistractionPayload,
  DistractionWorkspace,
} from "@/types/distraction";
import type {
  CognitiveLoadEntry,
  CognitiveLoadEntryPayload,
  CognitiveLoadWorkspace,
} from "@/types/cognitive-load";
import type {
  EnergyCheckIn,
  EnergyCheckInPayload,
  EnergyWorkspace,
} from "@/types/energy";
import type { ProductivityData } from "@/types/productivity";
import type { SleepRecord, SleepRecordPayload, SleepWorkspace } from "@/types/sleep";
import type {
  MovementBreak,
  MovementBreakPayload,
  MovementWorkspace,
} from "@/types/movement";

import type {
  Task,
  TaskCategory,
  TaskList,
  TaskPayload,
  TaskWorkspace,
} from "@/types/task";

import type {
  Habit,
  HabitCompletion,
  HabitPayload,
  HabitWorkspace,
} from "@/types/habit";

import type {
  FocusSession,
  FocusSessionPayload,
  FocusWorkspace,
} from "@/types/focus";

import type { PersonalPatternsWorkspace } from "@/types/personal-patterns";
import type { RecommendationWorkspace } from "@/types/recommendation";

import type {
  ScheduleEvent,
  ScheduleEventPayload,
  ScheduleWorkspace,
  SmartScheduleApplyResponse,
  SmartScheduleRequest,
  SmartScheduleResponse,
  SmartScheduleSuggestion,
} from "@/types/schedule";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type ApiErrorResponse = {
  detail?: string;
};

type ApiRequestOptions = RequestInit & {
  skipRefreshRetry?: boolean;
};

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { skipRefreshRetry = false, ...requestOptions } = options;
  const headers = new Headers(requestOptions.headers);

  if (!headers.has("Content-Type") && requestOptions.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...requestOptions,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && !skipRefreshRetry && endpoint !== "/api/auth/refresh") {
    const refreshed = await refreshSession();

    if (refreshed) {
      return apiRequest<T>(endpoint, {
        ...requestOptions,
        skipRefreshRetry: true,
      });
    }
  }

  if (!response.ok) {
    let message = "Something went wrong. Please try again.";

    try {
      const errorData = (await response.json()) as ApiErrorResponse;
      message = errorData.detail ?? message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  const method = (requestOptions.method ?? "GET").toUpperCase();
  const changesReminderData =
    method !== "GET" &&
    (endpoint.startsWith("/api/tasks") ||
      endpoint.startsWith("/api/habits") ||
      endpoint.startsWith("/api/schedule") ||
      endpoint.startsWith("/api/profile"));

  if (changesReminderData && typeof window !== "undefined") {
    window.dispatchEvent(new Event("flowmind:notification-data-change"));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function refreshSession() {
  try {
    await apiRequest<TokenResponse>("/api/auth/refresh", {
      method: "POST",
      skipRefreshRetry: true,
    });

    return true;
  } catch {
    return false;
  }
}

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type UserResponse = {
  id: number;
  full_name: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  is_email_verified: boolean;
  created_at: string;
};

export function loginUser(email: string, password: string) {
  return apiRequest<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerUser(fullName: string, email: string, password: string) {
  return apiRequest<MessageResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      full_name: fullName,
      email,
      password,
    }),
  });
}

export function getCurrentUser() {
  return apiRequest<UserResponse>("/api/auth/me", {
    method: "GET",
  });
}

export function logoutUser() {
  return apiRequest<{ message: string }>("/api/auth/logout", {
    method: "POST",
    skipRefreshRetry: true,
  });
}

export type MessageResponse = {
  message: string;
};

export function requestPasswordReset(email: string) {
  return apiRequest<MessageResponse>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipRefreshRetry: true,
  });
}

export function resetPassword(token: string, newPassword: string) {
  return apiRequest<MessageResponse>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token,
      new_password: newPassword,
    }),
    skipRefreshRetry: true,
  });
}

export function verifyEmail(token: string) {
  return apiRequest<MessageResponse>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
    skipRefreshRetry: true,
  });
}

export function resendVerificationEmail(email: string) {
  return apiRequest<MessageResponse>("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
    skipRefreshRetry: true,
  });
}

export type UserProfile = {
  id: number;
  full_name: string;
  email: string;
  is_email_verified: boolean;
  is_active: boolean;
  created_at: string;

  timezone: string;
  daily_focus_goal_minutes: number;
  week_starts_on: "monday" | "sunday";

  email_notifications: boolean;
  task_reminders: boolean;
  habit_reminders: boolean;
  weekly_summary: boolean;
  compact_dashboard: boolean;

  updated_at: string;
};

export type ProfileUpdatePayload = {
  full_name: string;
  timezone: string;
  daily_focus_goal_minutes: number;
  week_starts_on: "monday" | "sunday";

  email_notifications: boolean;
  task_reminders: boolean;
  habit_reminders: boolean;
  weekly_summary: boolean;
  compact_dashboard: boolean;
};

export type ProfileUpdateResponse = {
  message: string;
  profile: UserProfile;
};

export function getUserProfile() {
  return apiRequest<UserProfile>("/api/profile", {
    method: "GET",
  });
}

export function updateUserProfile(
  profile: ProfileUpdatePayload,
) {
  return apiRequest<ProfileUpdateResponse>("/api/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}
export function getTaskWorkspace() {
  return apiRequest<TaskWorkspace>("/api/tasks/workspace", { method: "GET" });
}

export function createTask(payload: TaskPayload) {
  return apiRequest<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTask(taskId: number, payload: Partial<TaskPayload>) {
  return apiRequest<Task>(`/api/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTask(taskId: number) {
  return apiRequest<void>(`/api/tasks/${taskId}`, { method: "DELETE" });
}

export function createTaskList(name: string, color: string) {
  return apiRequest<TaskList>("/api/tasks/lists", {
    method: "POST",
    body: JSON.stringify({ name, color, icon: "list" }),
  });
}

export function deleteTaskList(listId: number) {
  return apiRequest<void>(`/api/tasks/lists/${listId}`, { method: "DELETE" });
}

export function createTaskCategory(name: string, color: string) {
  return apiRequest<TaskCategory>("/api/tasks/categories", {
    method: "POST",
    body: JSON.stringify({ name, color }),
  });
}

export function deleteTaskCategory(categoryId: number) {
  return apiRequest<void>(`/api/tasks/categories/${categoryId}`, { method: "DELETE" });
}

export function getHabitWorkspace(targetDate?: string) {
  const query = targetDate ? `?target_date=${encodeURIComponent(targetDate)}` : "";
  return apiRequest<HabitWorkspace>(`/api/habits/workspace${query}`, {
    method: "GET",
  });
}

export function createHabit(payload: HabitPayload) {
  return apiRequest<Habit>("/api/habits", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateHabit(habitId: number, payload: Partial<HabitPayload>) {
  return apiRequest<Habit>(`/api/habits/${habitId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteHabit(habitId: number) {
  return apiRequest<void>(`/api/habits/${habitId}`, {
    method: "DELETE",
  });
}

export function checkInHabit(
  habitId: number,
  payload: { completion_date: string; count: number; note?: string | null },
) {
  return apiRequest<HabitCompletion | null>(`/api/habits/${habitId}/check-in`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}


export function getFocusWorkspace() {
  return apiRequest<FocusWorkspace>("/api/focus/workspace", { method: "GET" });
}

export function startFocusSession(payload: FocusSessionPayload) {
  return apiRequest<FocusSession>("/api/focus/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function pauseFocusSession(sessionId: number, elapsedSeconds: number) {
  return apiRequest<FocusSession>(`/api/focus/sessions/${sessionId}/pause`, {
    method: "PUT",
    body: JSON.stringify({ elapsed_seconds: elapsedSeconds }),
  });
}

export function resumeFocusSession(sessionId: number) {
  return apiRequest<FocusSession>(`/api/focus/sessions/${sessionId}/resume`, {
    method: "PUT",
  });
}

export function completeFocusSession(
  sessionId: number,
  elapsedSeconds: number,
  note: string | null,
  experience: "great" | "okay" | "difficult" | null,
) {
  return apiRequest<FocusSession>(`/api/focus/sessions/${sessionId}/complete`, {
    method: "PUT",
    body: JSON.stringify({ elapsed_seconds: elapsedSeconds, note, experience }),
  });
}

export function cancelFocusSession(
  sessionId: number,
  elapsedSeconds: number,
  note: string | null,
) {
  return apiRequest<FocusSession>(`/api/focus/sessions/${sessionId}/cancel`, {
    method: "PUT",
    body: JSON.stringify({ elapsed_seconds: elapsedSeconds, note }),
  });
}

export function deleteFocusSession(sessionId: number) {
  return apiRequest<void>(`/api/focus/sessions/${sessionId}`, {
    method: "DELETE",
  });
}


export function getScheduleWorkspace(rangeStart: string, rangeEnd: string) {
  const query = new URLSearchParams({ range_start: rangeStart, range_end: rangeEnd });
  return apiRequest<ScheduleWorkspace>(`/api/schedule/workspace?${query.toString()}`, {
    method: "GET",
  });
}

export function createScheduleEvent(payload: ScheduleEventPayload) {
  return apiRequest<ScheduleEvent>("/api/schedule/events", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateScheduleEvent(
  eventId: number,
  payload: Partial<ScheduleEventPayload>,
) {
  return apiRequest<ScheduleEvent>(`/api/schedule/events/${eventId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteScheduleEvent(eventId: number) {
  return apiRequest<void>(`/api/schedule/events/${eventId}`, {
    method: "DELETE",
  });
}

export function getSmartScheduleSuggestions(payload: SmartScheduleRequest) {
  return apiRequest<SmartScheduleResponse>("/api/schedule/smart-suggestions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function applySmartSchedule(suggestions: SmartScheduleSuggestion[]) {
  return apiRequest<SmartScheduleApplyResponse>("/api/schedule/smart-apply", {
    method: "POST",
    body: JSON.stringify({ suggestions }),
  });
}

export function getDashboardData() {
  return apiRequest<DashboardData>("/api/dashboard", { method: "GET" });
}
export function getProductivityData() {
  return apiRequest<ProductivityData>("/api/productivity", { method: "GET" });
}


export function getMovementWorkspace() {
  return apiRequest<MovementWorkspace>("/api/movement/workspace", { method: "GET" });
}

export function recordMovementBreak(payload: MovementBreakPayload) {
  return apiRequest<MovementBreak>("/api/movement/breaks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export function deleteMovementBreak(breakId: number) {
  return apiRequest<void>(`/api/movement/breaks/${breakId}`, {
    method: "DELETE",
  });
}


export function getEnergyWorkspace() {
  return apiRequest<EnergyWorkspace>("/api/energy/workspace", { method: "GET" });
}

export function createEnergyCheckIn(payload: EnergyCheckInPayload) {
  return apiRequest<EnergyCheckIn>("/api/energy/checkins", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteEnergyCheckIn(checkInId: number) {
  return apiRequest<void>(`/api/energy/checkins/${checkInId}`, {
    method: "DELETE",
  });
}


export function getSleepWorkspace() {
  return apiRequest<SleepWorkspace>("/api/sleep/workspace", { method: "GET" });
}

export function createSleepRecord(payload: SleepRecordPayload) {
  return apiRequest<SleepRecord>("/api/sleep/records", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteSleepRecord(recordId: number) {
  return apiRequest<void>(`/api/sleep/records/${recordId}`, {
    method: "DELETE",
  });
}


export function getCognitiveLoadWorkspace() {
  return apiRequest<CognitiveLoadWorkspace>("/api/cognitive-load/workspace", { method: "GET" });
}

export function createCognitiveLoadEntry(payload: CognitiveLoadEntryPayload) {
  return apiRequest<CognitiveLoadEntry>("/api/cognitive-load/entries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteCognitiveLoadEntry(entryId: number) {
  return apiRequest<void>(`/api/cognitive-load/entries/${entryId}`, {
    method: "DELETE",
  });
}


export function getIfThenWorkspace() {
  return apiRequest<IfThenWorkspace>("/api/if-then/workspace", { method: "GET" });
}

export function createIfThenPlan(payload: IfThenPlanPayload) {
  return apiRequest<IfThenPlan>("/api/if-then/plans", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateIfThenPlan(
  planId: number,
  payload: Partial<IfThenPlanPayload> & { is_active?: boolean },
) {
  return apiRequest<IfThenPlan>(`/api/if-then/plans/${planId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function recordIfThenOutcome(planId: number, outcome: IfThenOutcome) {
  return apiRequest<IfThenPlan>(`/api/if-then/plans/${planId}/outcomes`, {
    method: "POST",
    body: JSON.stringify({ outcome }),
  });
}

export function deleteIfThenPlan(planId: number) {
  return apiRequest<void>(`/api/if-then/plans/${planId}`, { method: "DELETE" });
}


export function getDistractionWorkspace() {
  return apiRequest<DistractionWorkspace>("/api/distractions/workspace", { method: "GET" });
}

export function createDistractionLog(payload: DistractionPayload) {
  return apiRequest<DistractionLog>("/api/distractions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteDistractionLog(logId: number) {
  return apiRequest<void>(`/api/distractions/${logId}`, { method: "DELETE" });
}


export function getProcrastinationWorkspace() {
  return apiRequest<ProcrastinationWorkspace>("/api/procrastination/workspace", { method: "GET" });
}

export function createProcrastinationStarter(payload: ProcrastinationStarterPayload) {
  return apiRequest<ProcrastinationStarter>("/api/procrastination/starters", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function toggleProcrastinationStarter(starterId: number) {
  return apiRequest<ProcrastinationStarter>(`/api/procrastination/starters/${starterId}/toggle`, {
    method: "PATCH",
  });
}

export function deleteProcrastinationStarter(starterId: number) {
  return apiRequest<void>(`/api/procrastination/starters/${starterId}`, { method: "DELETE" });
}


export function getExperimentWorkspace() {
  return apiRequest<ExperimentWorkspace>("/api/experiments/workspace", { method: "GET" });
}

export function createProductivityExperiment(payload: ExperimentPayload) {
  return apiRequest<ProductivityExperiment>("/api/experiments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function recordProductivityExperimentTrial(experimentId: number, payload: ExperimentTrialPayload) {
  return apiRequest<ProductivityExperiment>(`/api/experiments/${experimentId}/trials`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function completeProductivityExperiment(experimentId: number) {
  return apiRequest<ProductivityExperiment>(`/api/experiments/${experimentId}/complete`, { method: "PATCH" });
}

export function deleteProductivityExperiment(experimentId: number) {
  return apiRequest<void>(`/api/experiments/${experimentId}`, { method: "DELETE" });
}


export function getBurnoutWorkspace() {
  return apiRequest<BurnoutWorkspace>("/api/burnout/workspace", { method: "GET" });
}


export function getNourishmentWorkspace() {
  return apiRequest<NourishmentWorkspace>("/api/nourishment/workspace", { method: "GET" });
}

export function createNourishmentLog(payload: NourishmentLogPayload) {
  return apiRequest<NourishmentLog>("/api/nourishment/logs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteNourishmentLog(logId: number) {
  return apiRequest<void>(`/api/nourishment/logs/${logId}`, { method: "DELETE" });
}


export function getRecoveryWorkspace() {
  return apiRequest<RecoveryWorkspace>("/api/recovery/workspace", { method: "GET" });
}

export function createRecoveryBreak(payload: RecoveryBreakPayload) {
  return apiRequest<RecoveryBreak>("/api/recovery/breaks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteRecoveryBreak(breakId: number) {
  return apiRequest<void>(`/api/recovery/breaks/${breakId}`, { method: "DELETE" });
}


export function getTimeTrackingWorkspace() {
  return apiRequest<TimeTrackingWorkspace>("/api/time-tracking/workspace", { method: "GET" });
}

export function createWorkCategory(payload: { name: string; color: string; icon: string; weekly_target_minutes: number | null }) {
  return apiRequest<WorkCategory>("/api/time-tracking/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateWorkCategory(categoryId: number, payload: Partial<{ name: string; color: string; icon: string; weekly_target_minutes: number | null; is_archived: boolean }>) {
  return apiRequest<WorkCategory>(`/api/time-tracking/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteWorkCategory(categoryId: number) {
  return apiRequest<void>(`/api/time-tracking/categories/${categoryId}`, { method: "DELETE" });
}

export function updateTimeProject(projectId: number, payload: Partial<{ name: string; color: string; category_id: number | null; is_archived: boolean }>) {
  return apiRequest<TimeProject>(`/api/time-tracking/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function createTimeProject(payload: { name: string; color: string; category_id?: number | null }) {
  return apiRequest<TimeProject>("/api/time-tracking/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function startTimeTracker(payload: TimerStartPayload) {
  return apiRequest<TimeEntry>("/api/time-tracking/timer/start", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function stopTimeTracker() {
  return apiRequest<TimeEntry>("/api/time-tracking/timer/stop", { method: "POST" });
}

export function createManualTimeEntry(payload: ManualTimeEntryPayload) {
  return apiRequest<TimeEntry>("/api/time-tracking/entries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTimeEntry(entryId: number, payload: TimeEntryUpdatePayload) {
  return apiRequest<TimeEntry>(`/api/time-tracking/entries/${entryId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTimeEntry(entryId: number) {
  return apiRequest<void>(`/api/time-tracking/entries/${entryId}`, { method: "DELETE" });
}


export function getActivityTimeline(days = 30) {
  return apiRequest<ActivityTimeline>(`/api/activity/timeline?days=${days}&limit=300`, { method: "GET" });
}


export function getDeepWorkWorkspace() {
  return apiRequest<DeepWorkWorkspace>("/api/deep-work/workspace", { method: "GET" });
}

export function getWeeklyReview(weekOffset = 0) {
  return apiRequest<WeeklyReview>(`/api/weekly-review/workspace?week_offset=${weekOffset}`, { method: "GET" });
}

export function getWeeklyCoach(weekOffset = 0) {
  return apiRequest<WeeklyCoach>(`/api/weekly-coach/workspace?week_offset=${weekOffset}`, { method: "GET" });
}


export function getProductivityHeatmap(year?: number) {
  const query = year ? `?year=${year}` : "";
  return apiRequest<ProductivityHeatmapWorkspace>(`/api/productivity-heatmap/workspace${query}`, { method: "GET" });
}


export function getGoalsWorkspace() { return apiRequest<GoalsWorkspace>("/api/goals/workspace", { method: "GET" }); }
export function createGoal(payload: GoalPayload) { return apiRequest<Goal>("/api/goals", { method: "POST", body: JSON.stringify(payload) }); }
export function updateGoal(goalId: number, payload: Partial<GoalPayload & { is_active: boolean }>) { return apiRequest<Goal>(`/api/goals/${goalId}`, { method: "PATCH", body: JSON.stringify(payload) }); }
export function deleteGoal(goalId: number) { return apiRequest<void>(`/api/goals/${goalId}`, { method: "DELETE" }); }


export function getPersonalPatterns(days = 90) {
  return apiRequest<PersonalPatternsWorkspace>(`/api/personal-patterns/workspace?days=${days}`, { method: "GET" });
}


export function getRecommendationWorkspace(horizonDays = 7) {
  return apiRequest<RecommendationWorkspace>(`/api/recommendations/workspace?horizon_days=${horizonDays}`, { method: "GET" });
}


export function getLifeBalanceWorkspace() {
  return apiRequest<LifeBalanceWorkspace>("/api/life-balance/workspace", { method: "GET" });
}

export function saveLifeBalanceCheckIn(payload: LifeBalanceCheckInPayload) {
  return apiRequest<LifeBalanceCheckIn>("/api/life-balance/check-ins", { method: "POST", body: JSON.stringify(payload) });
}

export function deleteLifeBalanceCheckIn(checkinId: number) {
  return apiRequest<void>(`/api/life-balance/check-ins/${checkinId}`, { method: "DELETE" });
}


export function getHabitBreakerWorkspace() { return apiRequest<HabitBreakerWorkspace>("/api/habit-breaker/workspace", { method: "GET" }); }
export function createQuitJourney(payload: JourneyPayload) { return apiRequest<QuitJourney>("/api/habit-breaker", { method: "POST", body: JSON.stringify(payload) }); }
export function updateQuitJourney(id: number, payload: Partial<JourneyPayload & { is_active: boolean }>) { return apiRequest<QuitJourney>(`/api/habit-breaker/${id}`, { method: "PATCH", body: JSON.stringify(payload) }); }
export function deleteQuitJourney(id: number) { return apiRequest<void>(`/api/habit-breaker/${id}`, { method: "DELETE" }); }
export function resetQuitJourney(id: number, payload: { note?: string; trigger?: string; reset_at?: string }) { return apiRequest<void>(`/api/habit-breaker/${id}/reset`, { method: "POST", body: JSON.stringify(payload) }); }
export function addQuitReward(id: number, payload: { title: string; target_days: number; estimated_cost: number }) { return apiRequest(`/api/habit-breaker/${id}/rewards`, { method: "POST", body: JSON.stringify(payload) }); }
export function updateQuitReward(id: number, payload: { title?: string; target_days?: number; estimated_cost?: number; purchased?: boolean }) { return apiRequest(`/api/habit-breaker/rewards/${id}`, { method: "PATCH", body: JSON.stringify(payload) }); }
export function toggleQuitReward(id: number, payload: { purchased: boolean }) { return updateQuitReward(id, payload); }
export function deleteQuitReward(id: number) { return apiRequest<void>(`/api/habit-breaker/rewards/${id}`, { method: "DELETE" }); }
