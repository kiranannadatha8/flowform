import { expect, test } from "@playwright/test";

test("Phase 0 demo completes without database", async ({ page }) => {
  await page.goto("/demo");
  const name = page.getByRole("textbox", { name: "Name" });
  const role = page.getByRole("combobox", { name: "Role" });
  await name.fill("E2E User");
  await expect(name).toHaveValue("E2E User");
  await role.selectOption("eng");
  await expect(role).toHaveValue("eng");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Feedback" })).toBeVisible();
  await page.getByRole("textbox", { name: "What should we build next?" }).fill("Ship quality");
  await page.getByRole("spinbutton", { name: "Score (1–10)" }).fill("8");
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByText("Thanks — your response was received.")).toBeVisible();
});
