import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:5173";
const shouldSkipWebServer = process.env.E2E_SKIP_WEB_SERVER === "true";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: {
    // CI での遅延に備えて若干長めにする
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: shouldSkipWebServer
    ? undefined
    : {
        command: "npm run dev -- --host localhost --port 5173",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
