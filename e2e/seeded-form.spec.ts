import { expect, test } from "@playwright/test";

/**
 * Requires PostgreSQL, `prisma migrate deploy`, and `npm run db:seed` (demo-contact).
 * CI runs these before Playwright.
 */
test("published demo-contact form submits", async ({ page }) => {
  await page.goto("/f/demo-contact");
  await expect(page.getByRole("heading", { name: "Contact intake" })).toBeVisible();
  const fullName = page.getByRole("textbox", { name: "Full name" });
  const email = page.getByRole("textbox", { name: "Work email" });
  await fullName.fill("Seed E2E");
  await expect(fullName).toHaveValue("Seed E2E");
  await email.fill("seed-e2e@example.com");
  await expect(email).toHaveValue("seed-e2e@example.com");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Details" })).toBeVisible();
  await page.getByRole("textbox", { name: "What are you trying to build?" }).fill("End-to-end run");
  await page.getByLabel("Company size").selectOption("1-10");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Thanks — your response was received.")).toBeVisible();
});
