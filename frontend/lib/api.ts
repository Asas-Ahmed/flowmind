import type { DashboardData } from "@/types/dashboard";
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

import type {
  ScheduleEvent,
  ScheduleEventPayload,
  ScheduleWorkspace,
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
) {
  return apiRequest<FocusSession>(`/api/focus/sessions/${sessionId}/complete`, {
    method: "PUT",
    body: JSON.stringify({ elapsed_seconds: elapsedSeconds, note }),
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
