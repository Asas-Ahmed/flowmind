import { test } from "@playwright/test";
import { expectNoHorizontalOverflow } from "./helpers";

const routes = ["/", "/login", "/dashboard", "/tasks", "/habits", "/settings"];

for (const route of routes) {
  test(`responsive overflow check: ${route}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("domcontentloaded");
    await expectNoHorizontalOverflow(page);
  });
}
