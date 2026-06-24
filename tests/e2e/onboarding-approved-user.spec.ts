import { test, expect } from "@playwright/test";
import { uniqueEmail } from "./_helpers";
import postgres from "postgres";

const dbUrl = process.env.DATABASE_URL;

test.describe("onboarding for legacy/approved accounts", () => {
  test.skip(!dbUrl, "DATABASE_URL required for account state setup");

  test("approved user can load onboarding without 500", async ({ page }) => {
    const email = uniqueEmail("approved-onboard");
    await page.goto("/register");
    await page.getByLabel(/^Email/i).fill(email);
    await page.getByLabel(/^Password/i).fill("password123");
    await page.getByRole("button", { name: /Create account/i }).click();
    await expect(page).toHaveURL(/profile\/onboarding/, { timeout: 60_000 });

    const sql = postgres(dbUrl!, { max: 1 });
    try {
      const [user] = await sql`
        SELECT id FROM users WHERE email = ${email} LIMIT 1
      `;
      await sql`
        UPDATE users
        SET vetting_status = 'approved', pathway = 'amari'
        WHERE id = ${user.id}
      `;
    } finally {
      await sql.end({ timeout: 5 });
    }

    const resp = await page.goto("/profile/onboarding");
    expect(resp?.status(), "approved user GET should not 500").toBeLessThan(500);
    await expect(page.getByRole("heading", { name: /^Identity$/i })).toBeVisible();
  });

  test("elite user with concierge thread can load onboarding", async ({ page }) => {
    const email = uniqueEmail("elite-onboard");
    await page.goto("/register");
    await page.getByLabel(/^Email/i).fill(email);
    await page.getByLabel(/^Password/i).fill("password123");
    await page.getByRole("button", { name: /Create account/i }).click();
    await expect(page).toHaveURL(/profile\/onboarding/, { timeout: 60_000 });

    const sql = postgres(dbUrl!, { max: 1 });
    try {
      const [user] = await sql`
        SELECT id FROM users WHERE email = ${email} LIMIT 1
      `;
      await sql`
        UPDATE users
        SET vetting_status = 'approved', pathway = 'zahari', tier = 'elite'
        WHERE id = ${user.id}
      `;
      await sql`
        INSERT INTO concierge_threads (id, user_id, created_at)
        VALUES (gen_random_uuid(), ${user.id}, now())
        ON CONFLICT (user_id) DO NOTHING
      `;
    } finally {
      await sql.end({ timeout: 5 });
    }

    const resp = await page.goto("/profile/onboarding");
    expect(resp?.status(), "elite user GET should not 500").toBeLessThan(500);
    await expect(page.getByRole("heading", { name: /^Identity$/i })).toBeVisible();
  });
});
