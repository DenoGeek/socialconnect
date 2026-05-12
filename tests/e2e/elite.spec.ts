import { test, expect } from "@playwright/test";
import { register, uniqueEmail } from "./_helpers";

// Covers 3.0 The Elite.

test.describe("3.0 The Elite", () => {
  test("standard user can reserve a concierge consultation (3 fields)", async ({
    page,
  }) => {
    const email = uniqueEmail("intake");
    await register(page, "Intake User", email);
    await page.goto("/concierge/intake");
    await expect(
      page.getByRole("heading", { name: /Reserve a consultation/i }),
    ).toBeVisible();
    await page.getByLabel(/Phone/i).fill("+254700000001");
    await page.getByRole("button", { name: /Reserve/i }).click();
    await expect(page).toHaveURL(/concierge/);
  });

  test("standard user does NOT see elite-only events on Pulse Hub", async ({
    page,
  }) => {
    const email = uniqueEmail("noelite");
    await register(page, "Standard", email);
    await page.goto("/events");
    // No Elite-Only badges visible.
    const elite = page.getByText(/Elite-Only/i);
    await expect(elite).toHaveCount(0);
  });
});
