import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, expect, vi } from "vitest";

import { mswServer } from "@/test/msw/server";

// Radix UIの動的IDを正規化するスナップショットシリアライザー
// CI環境とローカル環境でIDが異なる問題を解決
expect.addSnapshotSerializer({
  test: (val) => {
    return typeof val === "string" && /radix-[a-z0-9«»]+/i.test(val);
  },
  print: (val) => {
    const normalized = String(val).replace(
      /radix-[a-z0-9«»]+/gi,
      "radix-NORMALIZED-ID",
    );
    return `"${normalized}"`;
  },
});

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
