import { expect, test } from "@playwright/test";

/**
 * Requires PostgreSQL, `prisma migrate deploy`, and `npm run db:seed` (demo-contact).
 * CI runs these before Playwright.
 */
test("published demo-contact form submits", async ({ page }) => {
  await page.goto("/f/demo-contact");
  await expect(page.getByRole("heading", { name: "Contact intake" })).toBeVisible();
  await page.getByPlaceholder("Jane Doe").fill("Seed E2E");
  await page.getByRole("textbox", { name: "Work email" }).fill("seed-e2e@example.com");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("textbox", { name: "What are you trying to build?" }).fill("End-to-end run");
  await page.getByLabel("Company size").selectOption("1-10");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Thanks — your response was received.")).toBeVisible();
});
