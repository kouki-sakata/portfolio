import type { BuildOptions } from "vite";

type BuildCommand = "build" | "serve";

type BuildContext = {
  command: BuildCommand;
  mode: string;
  env?: NodeJS.ProcessEnv;
};

const SOURCE_MAP_ENV_KEY = "VITE_BUILD_SOURCEMAP";
const DEFAULT_CHUNK_WARNING_LIMIT = 700;
const VENDOR_MANUAL_CHUNKS = {
  "react-vendor": ["react", "react-dom", "react/jsx-runtime"],
  "router-vendor": ["react-router-dom"],
  "ui-vendor": [
    "@radix-ui/react-label",
    "@radix-ui/react-slot",
    "@radix-ui/react-toast",
    "@radix-ui/react-alert-dialog",
    "@radix-ui/react-dialog",
    "@radix-ui/react-dropdown-menu",
    "@radix-ui/react-select",
    "@radix-ui/react-checkbox",
    "@radix-ui/react-progress",
  ],
  "data-vendor": ["@tanstack/react-query", "@tanstack/react-table"],
  "form-vendor": ["react-hook-form", "zod", "@hookform/resolvers"],
  "icons-vendor": ["lucide-react"],
} satisfies Record<string, string[]>;

const shouldEnableSourcemap = (env: NodeJS.ProcessEnv): boolean => {
  const value = env[SOURCE_MAP_ENV_KEY];
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1";
};

export const createBuildOptions = ({
  command,
  mode,
  env = process.env,
}: BuildContext): BuildOptions => {
  const isProductionBuild = command === "build" && mode === "production";

  return {
    outDir: "dist",
    sourcemap: isProductionBuild ? shouldEnableSourcemap(env) : true,
    manifest: isProductionBuild,
    cssCodeSplit: true,
    reportCompressedSize: false,
    minify: "esbuild",
    // Changed from es2022 to es2020 for broader browser compatibility
    // Supports: Chrome 87+, Firefox 78+, Safari 14+, Edge 88+
    target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"],
    chunkSizeWarningLimit: DEFAULT_CHUNK_WARNING_LIMIT,
    assetsInlineLimit: 4096,
    // Enable module preload polyfill for better code splitting support
    modulePreload: {
      polyfill: true,
    },
    rollupOptions: {
      output: {
        manualChunks: VENDOR_MANUAL_CHUNKS,
        // Optimize chunk file names for better caching
        chunkFileNames: isProductionBuild
          ? "assets/[name]-[hash].js"
          : "assets/[name].js",
        entryFileNames: isProductionBuild
          ? "assets/[name]-[hash].js"
          : "assets/[name].js",
        assetFileNames: isProductionBuild
          ? "assets/[name]-[hash].[ext]"
          : "assets/[name].[ext]",
      },
      // Tree-shaking optimization
      treeshake: {
        moduleSideEffects: "no-external",
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },
  } satisfies BuildOptions;
};
