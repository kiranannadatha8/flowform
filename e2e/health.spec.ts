import { expect, test } from "@playwright/test";

test("health endpoint", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { ok?: boolean; service?: string };
  expect(body.ok).toBe(true);
  expect(body.service).toBe("formflow");
});
