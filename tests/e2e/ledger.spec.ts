import { test, expect } from "@playwright/test";
import { register, uniqueEmail } from "./_helpers";

// Covers 5.0 social ledger + privacy guarantees.

test.describe("5.0 Social Ledger privacy", () => {
  test("ledger never reveals individual names on /events", async ({ page }) => {
    const email = uniqueEmail("ledger-priv");
    await register(page, "Counter Tester", email);
    await page.goto("/events");
    const ledger = page.locator('[data-testid="pulse-ledger"]');
    await expect(ledger).toBeVisible();
    // The literal user name should not appear inside the ledger card.
    await expect(ledger).not.toContainText("Counter Tester");
  });
});
