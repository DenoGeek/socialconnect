import { test, expect } from "@playwright/test";
import { uniqueEmail } from "./_helpers";

test("onboarding survives hard reload after step 1 save", async ({ page }) => {
  const email = uniqueEmail("onboard-reload");
  await page.goto("/register");
  await page.getByLabel(/^Email/i).fill(email);
  await page.getByLabel(/^Password/i).fill("password123");
  await page.getByRole("button", { name: /Create account/i }).click();
  await expect(page).toHaveURL(/profile\/onboarding/, { timeout: 60_000 });

  const firstName = page.getByLabel(/^First Name/i);
  await firstName.click();
  await firstName.fill("Reload");
  await page.getByLabel(/^Last Name/i).fill("Test");
  await page.getByRole("button", { name: /^Male$/i }).click();
  await page.getByLabel(/Date of Birth/i).fill("1990");
  await page.getByLabel(/^Current Country/i).fill("Kenya");
  await page.getByLabel(/^Current City/i).fill("Nairobi");
  await page.getByLabel(/Country of Heritage/i).fill("Kenya");
  await page.getByRole("button", { name: /Single \(Never Married\)/i }).click();
  await page.getByRole("button", { name: /^None$/i }).click();
  await page.getByRole("button", { name: /Content Without Children/i }).click();
  await page.locator("#educationLevel").selectOption({ label: "Bachelor's Degree" });
  await page.getByLabel(/Profession/i).fill("Engineer");
  await page.getByRole("button", { name: /Technology & Digital Ecosystems/i }).click();
  await page
    .locator("select")
    .filter({ hasText: "Leadership & Visionary Personas" })
    .first()
    .selectOption("Leadership & Visionary Personas");
  await page.getByRole("button", { name: /The Steward/i }).click();
  await page.getByLabel(/^Phone Number/i).fill("+254712345678");
  await page.getByRole("button", { name: /Continue/i }).click();
  await expect(
    page.getByRole("heading", { name: /Relationship & Intent/i }),
  ).toBeVisible({ timeout: 30_000 });

  const response = await page.reload({ waitUntil: "domcontentloaded" });
  expect(response?.status(), "reload should not 500").toBeLessThan(500);
  await expect(
    page.getByRole("heading", { name: /Relationship & Intent|Identity/i }),
  ).toBeVisible({ timeout: 30_000 });
});

test("onboarding GET returns <500 for fresh registration", async ({ page }) => {
  const email = uniqueEmail("onboard-get");
  await page.goto("/register");
  await page.getByLabel(/^Email/i).fill(email);
  await page.getByLabel(/^Password/i).fill("password123");

  const [registerResp] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/auth") && r.request().method() === "POST",
      { timeout: 60_000 },
    ),
    page.getByRole("button", { name: /Create account/i }).click(),
  ]);
  expect(registerResp.status()).toBeLessThan(500);

  await expect(page).toHaveURL(/profile\/onboarding/, { timeout: 60_000 });
  const onboardingResp = await page.goto("/profile/onboarding");
  expect(onboardingResp?.status(), "direct GET should not 500").toBeLessThan(500);
});
