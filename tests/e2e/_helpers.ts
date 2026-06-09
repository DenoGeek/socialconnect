import { Page, expect } from "@playwright/test";

let counter = 0;
export function uniqueEmail(prefix = "evermore") {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}@test.local`;
}

export async function register(page: Page, _name: string, email: string) {
  await page.goto("/register");
  await page.getByLabel(/Email/i).fill(email);
  await page.getByLabel(/Password/i).fill("password123");
  await page.getByRole("button", { name: /Create account/i }).click();
  await expect(page).toHaveURL(/profile\/onboarding|profile/);
}

export async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel(/Email/i).fill(email);
  await page.getByLabel(/Password/i).fill("password123");
  await page.getByRole("button", { name: /Sign in/i }).click();
  await expect(page).toHaveURL(/profile|onboarding|admin/);
}

export async function logout(page: Page) {
  await page.goto("/logout");
  await page.waitForURL(/\//);
}
