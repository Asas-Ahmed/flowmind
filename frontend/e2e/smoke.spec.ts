import { expect, test } from "@playwright/test";

const protectedPages = [
  "/dashboard",
  "/tasks",
  "/habits",
  "/focus",
  "/schedule",
  "/analytics",
  "/recommendations",
  "/settings",
];

for (const route of protectedPages) {
  test(`authenticated smoke check: ${route}`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.ok()).toBeTruthy();
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("This page could not be found");
  });
}
