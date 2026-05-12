import { test, expect } from "@playwright/test";
import { register, login, uniqueEmail } from "./_helpers";

test.describe("Auth — landing & signup", () => {
  test("marketing page renders the Social Ledger count", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator('[data-testid="social-ledger-count"]'),
    ).toBeVisible();
  });

  test("Explorer can sign up and reach onboarding", async ({ page }) => {
    const email = uniqueEmail("explorer");
    await register(page, "Test Explorer", email);
    await expect(
      page.getByRole("heading", { name: /Tell us who you are/i }),
    ).toBeVisible();
  });

  test("Explorer can log in after signup", async ({ page }) => {
    const email = uniqueEmail("returning");
    await register(page, "Returning User", email);
    await page.goto("/logout");
    await login(page, email);
  });

  test("Forgot password page renders", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(
      page.getByRole("button", { name: /Send reset link/i }),
    ).toBeVisible();
  });
});
