import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: "./dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }) as import("vite").PluginOption,
  ],
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
    rollupOptions: {
      output: {
        manualChunks: {
          // React core libraries
          "react-vendor": ["react", "react-dom", "react/jsx-runtime"],
          // React Router
          "router-vendor": ["react-router-dom"],
          // Radix UI primitives
          "ui-vendor": [
            "@radix-ui/react-label",
            "@radix-ui/react-slot",
            "@radix-ui/react-toast",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-popover",
            "@radix-ui/react-progress",
          ],
          // Data management libraries
          "data-vendor": ["@tanstack/react-query", "@tanstack/react-table"],
          // Form management and validation
          "form-vendor": ["react-hook-form", "zod", "@hookform/resolvers"],
          // Date utilities
          "date-vendor": ["date-fns", "react-day-picker"],
          // Icons
          "icons-vendor": ["lucide-react"],
        },
      },
    },
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
  },
});
