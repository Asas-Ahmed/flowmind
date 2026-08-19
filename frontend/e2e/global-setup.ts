import { request, type FullConfig } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const backendUrl = "http://localhost:8010";
const email = "e2e.user@example.com";
const password = "E2ePass123!";

export default async function globalSetup(_config: FullConfig) {
  const authDir = path.resolve("playwright/.auth");
  await fs.mkdir(authDir, { recursive: true });

  const api = await request.newContext({ baseURL: backendUrl });

  const reset = await api.post("/api/e2e/reset");
  if (!reset.ok()) {
    throw new Error(`Unable to reset FlowMind E2E database: ${reset.status()}`);
  }

  const login = await api.post("/api/auth/login", {
    data: { email, password },
  });

  if (!login.ok()) {
    throw new Error(`Unable to authenticate FlowMind E2E user: ${login.status()}`);
  }

  await api.storageState({ path: path.join(authDir, "user.json") });
  await api.dispose();
}
