import { expect, test } from "@playwright/test";
import { resetE2EState } from "./helpers";

test.describe("FlowMind focus-session journey", () => {
  test.beforeEach(async ({ request }) => {
    await resetE2EState(request);
  });

  test("starts and completes a focus session", async ({ page }) => {
    await page.goto("/focus");
    await expect(page.getByRole("heading", { name: "Start a focused work block" })).toBeVisible();

    await page.getByRole("button", { name: "Start session" }).click();
    await expect(page.getByRole("button", { name: "Complete" })).toBeVisible();
    await page.getByRole("button", { name: "Complete" }).click();

    const skipReflection = page.getByRole("button", { name: "Skip reflection" });
    if (await skipReflection.isVisible()) {
      await skipReflection.click();
    }

    await expect(page.getByText("Session history", { exact: true })).toBeVisible();
  });
});
