import { expect, test } from "@playwright/test";
import { BACKEND_URL } from "./helpers";

const browserRoutes = ["/", "/dashboard", "/tasks"];

for (const route of browserRoutes) {
  test(`lightweight navigation timing: ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("networkidle");

    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
        load: nav.loadEventEnd - nav.startTime,
      };
    });

    expect(timing.domContentLoaded).toBeLessThan(15_000);
    expect(timing.load).toBeLessThan(20_000);
  });
}

test("backend health endpoint responds within a lightweight threshold", async ({ request }) => {
  const started = Date.now();
  const response = await request.get(`${BACKEND_URL}/api/health`);
  const elapsed = Date.now() - started;

  expect(response.ok()).toBeTruthy();
  expect(elapsed).toBeLessThan(5_000);
});
