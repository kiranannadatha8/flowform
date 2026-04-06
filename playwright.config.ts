import { defineConfig, devices } from "@playwright/test";

/** Local default 3010 avoids clashing with `next dev` on 3000 when reuseExistingServer is off. */
const port = Number(
  process.env.PLAYWRIGHT_PORT ?? process.env.PORT ?? (process.env.CI ? 3000 : 3010),
);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start",
    url: baseURL,
    // Avoid false failures when an old dev server is already bound to PORT (stale bundle).
    reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
    timeout: 120_000,
    env: { ...process.env, PORT: String(port) },
  },
});
