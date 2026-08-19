import { expect, test } from "@playwright/test";
import { resetE2EState } from "./helpers";

test.describe("FlowMind task journey", () => {
  test.beforeEach(async ({ request }) => {
    await resetE2EState(request);
  });

  test("creates a task through the real browser UI", async ({ page }) => {
    const title = `E2E task ${Date.now()}`;

    await page.goto("/tasks");
    await expect(page).not.toHaveURL(/\/login/);
    await page.getByRole("button", { name: "New task" }).click();

    await expect(page.getByRole("heading", { name: "Task details" })).toBeVisible();
    await page.getByPlaceholder("What needs to be done?").fill(title);
    await page.getByPlaceholder("Add useful details...").fill("Created by Playwright E2E testing.");
    await page.getByRole("button", { name: "Create task" }).click();

    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  });

  test("task remains visible after reloading the workspace", async ({ page }) => {
    const title = `Persistent E2E task ${Date.now()}`;

    await page.goto("/tasks");
    await page.getByRole("button", { name: "New task" }).click();
    await page.getByPlaceholder("What needs to be done?").fill(title);
    await page.getByRole("button", { name: "Create task" }).click();
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();

    await page.reload();
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  });
});
