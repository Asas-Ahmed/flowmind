import { afterEach, describe, expect, it, vi } from "vitest";

import {
  apiRequest,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  requestPasswordReset,
} from "@/lib/api";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("FlowMind API client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends login credentials to the expected endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ access_token: "a", refresh_token: "r", token_type: "bearer" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await loginUser("test@example.com", "Pass1234");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/api/auth/login");
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("include");
    expect(JSON.parse(String(options.body))).toEqual({
      email: "test@example.com",
      password: "Pass1234",
    });
  });

  it("sends registration data using backend field names", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ message: "created" }, 201));
    vi.stubGlobal("fetch", fetchMock);

    await registerUser("Test User", "test@example.com", "Pass1234");

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(String(options.body))).toEqual({
      full_name: "Test User",
      email: "test@example.com",
      password: "Pass1234",
    });
  });

  it("uses credentials include for current-user requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ id: 1, email: "test@example.com" }));
    vi.stubGlobal("fetch", fetchMock);

    await getCurrentUser();
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(options.credentials).toBe("include");
  });

  it("does not retry logout through refresh", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ detail: "unauthorized" }, 401));
    vi.stubGlobal("fetch", fetchMock);

    await expect(logoutUser()).rejects.toThrow("unauthorized");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns backend detail messages for failed requests", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ detail: "Task not found" }, 404)));
    await expect(apiRequest("/api/tasks/999")).rejects.toThrow("Task not found");
  });

  it("returns undefined for successful 204 responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(apiRequest("/api/tasks/1", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("forgot-password is not refresh-retried", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ detail: "rate limited" }, 429));
    vi.stubGlobal("fetch", fetchMock);
    await expect(requestPasswordReset("test@example.com")).rejects.toThrow("rate limited");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries one request after a successful refresh", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ detail: "expired" }, 401))
      .mockResolvedValueOnce(jsonResponse({ access_token: "new", refresh_token: "r", token_type: "bearer" }, 200))
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200));
    vi.stubGlobal("fetch", fetchMock);

    await expect(apiRequest<{ ok: boolean }>("/api/dashboard")).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
