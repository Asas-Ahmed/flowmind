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
  created_at: string;
};

export function loginUser(email: string, password: string) {
  return apiRequest<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerUser(fullName: string, email: string, password: string) {
  return apiRequest<UserResponse>("/api/auth/register", {
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