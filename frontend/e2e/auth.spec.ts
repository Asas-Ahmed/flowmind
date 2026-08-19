import { expect, test } from "@playwright/test";
import { E2E_EMAIL, E2E_PASSWORD, resetE2EState } from "./helpers";

test.describe("FlowMind authentication journey", () => {
  test.beforeEach(async ({ context, request }) => {
    await resetE2EState(request);
    await context.clearCookies();
  });

  test("redirects an anonymous user from a protected route to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard|\/login\?redirect=\/dashboard/);
    await expect(page.getByRole("heading", { name: "Sign in to FlowMind" })).toBeVisible();
  });

  test("logs in a verified user and opens the dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(E2E_EMAIL);
    await page.getByLabel("Password").fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Dashboard", { exact: true }).first()).toBeVisible();
  });

  test("rejects an invalid password without authenticating", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(E2E_EMAIL);
    await page.getByLabel("Password").fill("WrongPassword123!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/incorrect|invalid|password/i).first()).toBeVisible();
  });
});
