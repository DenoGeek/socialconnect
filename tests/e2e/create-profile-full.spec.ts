import { test, expect } from "@playwright/test";
import { uniqueEmail } from "./_helpers";

async function fillIdentityStep(page: import("@playwright/test").Page) {
  const firstName = page.getByLabel(/^First Name/i);
  await firstName.click();
  await firstName.fill("Test");
  await page.getByLabel(/^Last Name/i).fill("Explorer");
  await page.getByRole("button", { name: /^Male$/i }).click();
  await page.getByLabel(/Date of Birth/i).fill("1990");
  await page.getByLabel(/^Current Location/i).fill("Kenya");
  await page.getByLabel(/^Current City/i).fill("Nairobi");
  await page.getByLabel(/Country of Heritage/i).fill("Kenya");
  await page.getByRole("button", { name: /Single \(Never Married\)/i }).click();
  await page.getByRole("button", { name: /^None$/i }).click();
  await page.locator("#educationLevel").selectOption({ label: "Bachelor's Degree" });
  await page.getByLabel(/Profession/i).fill("Software Engineer");
  await page
    .getByRole("button", { name: /Technology & Digital Ecosystems/i })
    .click();
  await page
    .locator("select")
    .filter({ hasText: "Leadership & Visionary Personas" })
    .first()
    .selectOption("Leadership & Visionary Personas");
  await page.getByRole("button", { name: /The Steward/i }).click();
  await page.getByLabel(/^Phone Number/i).fill("+254712345678");
}

async function fillIntentStep(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /Covenant Ready/i }).click();
  await page.getByRole("button", { name: /Yes, globally/i }).click();
  await page
    .getByRole("button", {
      name: /Daily prayer together/i,
    })
    .first()
    .click();
  await page
    .getByRole("button", {
      name: /comfortable with slight theological differences/i,
    })
    .click();
  await page
    .getByRole("button", {
      name: /biblical order where the husband/i,
    })
    .click();
  await page
    .getByRole("button", {
      name: /high demands, travel, and hours of an executive/i,
    })
    .click();
  await page
    .getByRole("button", {
      name: /build a shared financial empire/i,
    })
    .click();
  await page
    .getByRole("button", {
      name: /city-centric lifestyle spaces/i,
    })
    .click();
}

async function fillInterestsStep(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: /^Hiking$/i }).first().click();
  await page
    .getByRole("button", { name: /Pentecostal \/ Charismatic/i })
    .click();
}

async function assertNoSaveError(page: import("@playwright/test").Page) {
  const saveError = page.locator('[class*="danger"], [role="alert"]');
  const errText = await saveError.first().textContent().catch(() => "");
  if (errText && /required|could not|failed|error/i.test(errText)) {
    throw new Error(`Save failed: ${errText}`);
  }
}

test.describe("Create Profile — full flow", () => {
  test("register and complete all onboarding steps", async ({ page }) => {
    const email = uniqueEmail("onboard-full");
    await page.goto("/register");
    await page.getByLabel(/^Email/i).fill(email);
    await page.getByLabel(/^Password/i).fill("password123");
    await page.getByRole("button", { name: /Create account/i }).click();
    await expect(page).toHaveURL(/profile\/onboarding/, { timeout: 60_000 });

    await expect(page.getByRole("heading", { name: /^Identity$/i })).toBeVisible();

    await fillIdentityStep(page);
    await page.getByRole("button", { name: /Continue/i }).click();
    await expect(
      page.getByRole("heading", { name: /Relationship and Intent/i }),
    ).toBeVisible({ timeout: 30_000 });
    await assertNoSaveError(page);

    await fillIntentStep(page);
    await page.getByRole("button", { name: /Continue/i }).click();
    await expect(
      page.getByRole("heading", { name: /Interests & Lifestyle Alignment/i }),
    ).toBeVisible({ timeout: 30_000 });
    await assertNoSaveError(page);

    await fillInterestsStep(page);
    await page.getByRole("button", { name: /Continue/i }).click();
    await expect(
      page.getByRole("heading", { name: /Choose Your Journey/i }),
    ).toBeVisible({ timeout: 30_000 });
    await assertNoSaveError(page);

    await expect(page.getByRole("link", { name: /Apply for Amari/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Apply for Zahari/i })).toBeVisible();
  });
});
