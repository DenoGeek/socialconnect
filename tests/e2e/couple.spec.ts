import { test, expect } from "@playwright/test";
import { register, uniqueEmail } from "./_helpers";

// Covers Test Cases Sheet 2.0 — The Partnered/Couple.

test.describe("2.0 The Partnered / Couple", () => {
  test("Duo-Sync invite + accept flow", async ({ page, browser }) => {
    const inviterEmail = uniqueEmail("inviter");
    const inviteeEmail = uniqueEmail("invitee");

    await register(page, "Sync Inviter", inviterEmail);
    await page.goto("/duo");
    await page.getByPlaceholder("Their email").fill(inviteeEmail);
    await page.getByRole("button", { name: /Generate sync link/i }).click();

    // Find the token in the rendered code block.
    await expect(page.getByText(/Your sync/i)).toBeVisible();
    const tokenCode = await page.locator("code").first().textContent();
    const token = tokenCode?.match(/token=([a-f0-9]+)/i)?.[1];
    expect(token).toBeTruthy();

    // Accept as a second user.
    const ctx2 = await browser.newContext();
    const p2 = await ctx2.newPage();
    await register(p2, "Sync Invitee", inviteeEmail);
    await p2.goto(`/duo?token=${token}`);
    await p2.getByRole("button", { name: /Accept and sync/i }).click();
    await expect(p2.getByText(/synced/i)).toBeVisible();
  });

  test("Date Vault index loads", async ({ page }) => {
    const email = uniqueEmail("vault");
    await register(page, "Vault User", email);
    await page.goto("/date-vault");
    await expect(
      page.getByRole("heading", { name: /Date Vault/i }),
    ).toBeVisible();
  });

  test("Programs catalogue loads with kind filters", async ({ page }) => {
    const email = uniqueEmail("programs");
    await register(page, "Programs User", email);
    await page.goto("/programs");
    await expect(
      page.getByRole("heading", { name: /Education Hub/i }),
    ).toBeVisible();
    await page.getByRole("link", { name: /Agano Ascent/i }).first().click();
    await expect(page).toHaveURL(/kind=agano_ascent/);
  });

  test("Professionals directory loads with specialty filters", async ({
    page,
  }) => {
    const email = uniqueEmail("prof");
    await register(page, "Prof User", email);
    await page.goto("/professionals");
    await expect(
      page.getByRole("heading", { name: /Professional Directory/i }),
    ).toBeVisible();
  });

  test("Trips catalogue + private/group filter", async ({ page }) => {
    const email = uniqueEmail("trips");
    await register(page, "Trips User", email);
    await page.goto("/trips");
    await expect(
      page.getByRole("heading", { name: /Bespoke Trips/i }),
    ).toBeVisible();
    await page.getByRole("link", { name: /^Private$/ }).click();
    await expect(page).toHaveURL(/scope=private/);
  });
});
