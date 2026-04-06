import { expect, test } from "@playwright/test";

test("Phase 0 demo completes without database", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("textbox", { name: "Name" }).fill("E2E User");
  await page.getByLabel("Role").selectOption("eng");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("textbox", { name: "What should we build next?" }).fill("Ship quality");
  await page.getByRole("spinbutton", { name: "Score (1–10)" }).fill("8");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Thanks — your response was received.")).toBeVisible();
});
