import { test, expect } from "@playwright/test";
import { register, uniqueEmail } from "./_helpers";

// Covers Test Cases Sheet 1.0 — The Explorer persona.

test.describe("1.0 The Explorer journey", () => {
  test("Create Profile flow validates Step 1 and is resumable", async ({
    page,
  }) => {
    const email = uniqueEmail("create-profile");
    await register(page, "Resumable Explorer", email);

    // Lands on the Create Profile flow (Step 1: Identity).
    await expect(
      page.getByRole("heading", { name: /^Identity$/i }),
    ).toBeVisible();

    // Required-field validation blocks an empty Step 1.
    await page.getByRole("button", { name: /Continue/i }).click();
    await expect(page.getByText(/First name is required/i)).toBeVisible();

    // Drop off, then resume — the flow remains reachable pre-approval.
    await page.goto("/profile/onboarding");
    await expect(
      page.getByRole("heading", { name: /^Identity$/i }),
    ).toBeVisible();
  });

  test("Pulse Hub shows ledger count + events", async ({ page }) => {
    const email = uniqueEmail("pulse");
    await register(page, "Pulse Explorer", email);
    await page.goto("/events");
    await expect(
      page.getByRole("heading", { name: /Evermore Pulse/i }),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="pulse-ledger"]'),
    ).toContainText(/Souls connecting today/i);
  });

  test("matches page is empty for a fresh Explorer", async ({ page }) => {
    const email = uniqueEmail("matches");
    await register(page, "Matches Explorer", email);
    await page.goto("/matches");
    await expect(
      page.getByRole("heading", { name: /Your matches/i }),
    ).toBeVisible();
    await expect(page.getByText(/No matches yet/i)).toBeVisible();
  });

  test("Explorer can switch mode to Couple without errors", async ({
    page,
  }) => {
    const email = uniqueEmail("mode");
    await register(page, "Mode Explorer", email);
    await page.goto("/profile/mode");
    await page
      .getByRole("button", { name: /Switch to Couple/i })
      .click();
    await page.goto("/profile");
    await expect(page.getByText(/couple/i).first()).toBeVisible();
  });
});
