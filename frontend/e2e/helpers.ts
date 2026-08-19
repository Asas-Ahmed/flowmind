import { expect, type APIRequestContext, type Page } from "@playwright/test";

export const E2E_EMAIL = "e2e.user@example.com";
export const E2E_PASSWORD = "E2ePass123!";
export const BACKEND_URL = "http://localhost:8010";

export async function resetE2EState(request: APIRequestContext) {
  const response = await request.post(`${BACKEND_URL}/api/e2e/reset`);
  expect(response.ok()).toBeTruthy();
}

export async function loginThroughUI(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(E2E_EMAIL);
  await page.getByLabel("Password").fill(E2E_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));

  expect(
    dimensions.document,
    `Horizontal overflow detected: document=${dimensions.document}, viewport=${dimensions.viewport}`,
  ).toBeLessThanOrEqual(dimensions.viewport + 2);
}
