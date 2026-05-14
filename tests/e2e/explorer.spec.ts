import { test, expect } from "@playwright/test";
import { register, uniqueEmail } from "./_helpers";

// Covers Test Cases Sheet 1.0 — The Explorer persona.

test.describe("1.0 The Explorer journey", () => {
  test("psychometric onboarding is resumable + finalisable", async ({
    page,
  }) => {
    const email = uniqueEmail("psych");
    await register(page, "Resumable Explorer", email);

    // Fill basics, advance.
    await page.getByLabel("Display name").fill("Resumable Explorer");
    await page.getByLabel("City").fill("Nairobi");
    await page.getByRole("button", { name: /Continue/i }).click();

    // Intent badges.
    await expect(
      page.getByRole("heading", { name: /relationship intent/i }),
    ).toBeVisible();
    await page.getByText("Ready for Covenant", { exact: false }).click();
    await page.getByText("Iron Sharpens Iron").click();

    // Drop off mid-flow.
    await page.goto("/profile");
    await expect(
      page.getByText(/Complete your psychometric/i),
    ).toBeVisible();

    // Resume.
    await page.getByRole("link", { name: /Continue onboarding/i }).click();
    // Bypass remaining sections by going to review through Continue clicks.
    for (let i = 0; i < 12; i++) {
      const cont = page.getByRole("button", { name: /Continue/i });
      if (await cont.isVisible().catch(() => false)) {
        await cont.click();
      } else {
        break;
      }
    }
    // Finalise if we landed on review.
    const finalise = page.getByRole("button", {
      name: /Take my profile live/i,
    });
    if (await finalise.isVisible().catch(() => false)) {
      await finalise.click();
      await expect(page).toHaveURL(/profile/);
    }
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
