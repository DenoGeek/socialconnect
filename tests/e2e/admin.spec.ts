import { test, expect } from "@playwright/test";
import { register, uniqueEmail } from "./_helpers";

// Covers 4.0 admin guards.

test.describe("4.0 Admin access guards", () => {
  test("standard user cannot open /admin", async ({ page }) => {
    const email = uniqueEmail("guarded");
    await register(page, "Standard", email);
    await page.goto("/admin");
    // requireAdmin redirects to "/" for non-admins.
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test("standard user cannot open /facilitator", async ({ page }) => {
    const email = uniqueEmail("guarded2");
    await register(page, "Standard", email);
    await page.goto("/facilitator");
    await expect(page).not.toHaveURL(/\/facilitator/);
  });
});
