import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// 各テスト後のクリーンアップ
afterEach(() => {
  cleanup();
});

// Unhandled promise rejectionsのハンドリング
if (typeof process !== "undefined") {
  process.on("unhandledRejection", (reason) => {
    // biome-ignore lint/suspicious/noConsole: Test environment error visibility required
    console.error("Unhandled promise rejection:", reason);
  });
}
