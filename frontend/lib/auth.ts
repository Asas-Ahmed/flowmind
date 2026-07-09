export const ACCESS_TOKEN_KEY = "flowmind_access_token";
export const REFRESH_TOKEN_KEY = "flowmind_refresh_token";
export const AUTH_COOKIE_KEY = "flowmind_auth";

const isBrowser = typeof window !== "undefined";

export function saveAuthTokens(accessToken: string, refreshToken: string) {
  if (!isBrowser) return;

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

  document.cookie = `${AUTH_COOKIE_KEY}=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function getAccessToken() {
  if (!isBrowser) return null;

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  if (!isBrowser) return null;

  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearAuthTokens() {
  if (!isBrowser) return;

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);

  document.cookie = `${AUTH_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
}