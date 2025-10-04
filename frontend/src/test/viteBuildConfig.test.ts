import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createBuildOptions } from "@/shared/viteBuildConfig";

const SOURCE_MAP_KEY = "VITE_BUILD_SOURCEMAP";
const originalValue = process.env[SOURCE_MAP_KEY];

describe("createBuildOptions", () => {
  beforeEach(() => {
    delete process.env[SOURCE_MAP_KEY];
  });

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env[SOURCE_MAP_KEY];
    } else {
      process.env[SOURCE_MAP_KEY] = originalValue;
    }
  });

  it("disables sourcemaps for production builds by default", () => {
    const options = createBuildOptions({
      command: "build",
      mode: "production",
    });
    expect(options.sourcemap).toBe(false);
  });

  it("allows opting back into sourcemaps via VITE_BUILD_SOURCEMAP", () => {
    process.env[SOURCE_MAP_KEY] = "true";
    const options = createBuildOptions({
      command: "build",
      mode: "production",
    });
    expect(options.sourcemap).toBe(true);
  });
});
