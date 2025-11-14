import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vitest/config";

import { createBuildOptions } from "./src/shared/viteBuildConfig";

const shouldAnalyzeBundle = (env: NodeJS.ProcessEnv) => {
  const value = env["VITE_ANALYZE_BUNDLE"];
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1";
};

export default defineConfig(({ command, mode }) => {
  const env = process.env;
  const plugins: import("vite").PluginOption[] = [react(), tailwindcss()];

  if (shouldAnalyzeBundle(env)) {
    plugins.push(
      visualizer({
        filename: "./dist/stats.html",
        open: false,
        gzipSize: true,
        brotliSize: true,
      }) as import("vite").PluginOption
    );
  }

  return {
    plugins,
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
          // Cookie を正しく転送
          cookieDomainRewrite: "localhost",
          cookiePathRewrite: "/",
          // カスタムヘッダーを保持
          configure: (proxy, _options) => {
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              // CSRF Token ヘッダーを明示的に転送
              const csrfToken = req.headers["x-xsrf-token"];
              if (csrfToken) {
                proxyReq.setHeader("X-XSRF-TOKEN", csrfToken);
              }
            });
          },
        },
      },
    },
    preview: {
      port: 4173,
    },
    build: createBuildOptions({
      command: command as "build" | "serve",
      mode,
      env,
    }),
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
      testTimeout: 20_000,
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
        // カバレッジ閾値（閾値を下回るとビルドが失敗する）
        thresholds: {
          statements: 70,
          branches: 65,
          functions: 70,
          lines: 70,
        },
      },
    },
  };
});
