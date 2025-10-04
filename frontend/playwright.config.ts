import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5173";
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
    env: {
      VITE_DISABLE_REACT_QUERY_DEVTOOLS: "true",
      VITE_DISABLE_DATA_TABLE_VIEW_OPTIONS: "true",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: shouldSkipWebServer
    ? undefined
    : {
        command: "npm run dev -- --host 127.0.0.1 --port 5173",
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
