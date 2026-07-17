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