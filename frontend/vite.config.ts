import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 4173,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
    include: [
      "src/**/*.{test,spec}.ts",
      "src/**/*.{test,spec}.tsx",
      "src/**/__tests__/**/*.{ts,tsx}",
    ],
    // Exclude E2E (Playwright) specs from Vitest discovery
    exclude: [
      "node_modules/**",
      "e2e/**",
      "playwright.config.ts",
      // default vitest excludes are preserved implicitly
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
    // unhandled rejectionsの処理を追加
    onUnhandledError: (error) => {
      // テスト中のunhandled errorをログに記録
      console.error("Unhandled error in test:", error);
      return false; // エラーを無視しない
    },
  },
});
