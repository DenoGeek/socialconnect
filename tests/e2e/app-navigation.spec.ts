import { test, expect } from "@playwright/test";
import { register, uniqueEmail } from "./_helpers";

test("signed-in user can open Hearth from profile sidebar", async ({ page }) => {
  const email = uniqueEmail("hearth-nav");
  await register(page, "Hearth Nav", email);
  await page.goto("/profile");
  await expect(page).toHaveURL(/\/profile/);
  await page.getByRole("link", { name: "Hearth" }).click();
  await expect(page).toHaveURL(/\/residential/);
  await expect(page.getByRole("heading", { name: /Agano Hearth/i })).toBeVisible();
});
