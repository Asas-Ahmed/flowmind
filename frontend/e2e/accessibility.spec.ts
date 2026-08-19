import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const publicPages = ["/", "/login", "/register"];
const protectedPages = ["/dashboard", "/tasks", "/habits", "/focus", "/schedule", "/settings"];

for (const route of [...publicPages, ...protectedPages]) {
  test(`axe accessibility scan: ${route}`, async ({ page, context }) => {
    if (publicPages.includes(route)) {
      await context.clearCookies();
    }

    await page.goto(route);
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const seriousOrCritical = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );

    expect(
      seriousOrCritical,
      seriousOrCritical
        .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`)
        .join("\n"),
    ).toEqual([]);
  });
}
