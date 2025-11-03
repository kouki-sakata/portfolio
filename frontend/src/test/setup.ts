import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { mswServer } from "@/test/msw/server";

const DEFAULT_API_BASE_URL = "http://localhost/api";

vi.stubEnv("VITE_API_BASE_URL", DEFAULT_API_BASE_URL);

// Mock ResizeObserver for Recharts
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

beforeAll(() => {
  mswServer.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  mswServer.resetHandlers();
  cleanup();
});

afterAll(() => {
  mswServer.close();
  vi.unstubAllEnvs();
});

// Unhandled promise rejectionsのハンドリング
if (typeof process !== "undefined") {
  process.on("unhandledRejection", (reason) => {
    // biome-ignore lint/suspicious/noConsole: Test environment error visibility required
    console.error("Unhandled promise rejection:", reason);
  });
}
