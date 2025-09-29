import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// 各テスト後のクリーンアップ
afterEach(() => {
  cleanup();
});

// Unhandled promise rejectionsのハンドリング
if (typeof process !== "undefined") {
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
  });
}
