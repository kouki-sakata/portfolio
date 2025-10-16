import { beforeEach, describe, expect, it } from "vitest";
import {
  createApiPath,
  ensureRelativePath,
  validateApiPath,
} from "./api-path-utils";

describe("api-path-utils", () => {
  describe("ensureRelativePath", () => {
    it("removes /api prefix from path", () => {
      expect(ensureRelativePath("/api/news")).toBe("/news");
      expect(ensureRelativePath("/api/employees")).toBe("/employees");
      expect(ensureRelativePath("/api/stamp-history")).toBe("/stamp-history");
    });

    it("preserves path without /api prefix", () => {
      expect(ensureRelativePath("/news")).toBe("/news");
      expect(ensureRelativePath("/employees")).toBe("/employees");
    });

    it("adds leading slash if missing", () => {
      expect(ensureRelativePath("news")).toBe("/news");
      expect(ensureRelativePath("employees")).toBe("/employees");
    });

    it("handles complex paths", () => {
      expect(ensureRelativePath("/api/news/123/publish")).toBe(
        "/news/123/publish"
      );
      expect(ensureRelativePath("/news/123/publish")).toBe("/news/123/publish");
    });
  });

  describe("validateApiPath", () => {
    beforeEach(() => {
      // Reset DEV mode for each test
      import.meta.env.DEV = true;
    });

    it("accepts valid relative paths in DEV mode", () => {
      expect(validateApiPath("/news")).toBe("/news");
      expect(validateApiPath("/employees")).toBe("/employees");
      expect(validateApiPath("/stamp-history")).toBe("/stamp-history");
    });

    it("throws error for /api prefix in DEV mode", () => {
      expect(() => validateApiPath("/api/news")).toThrow(
        'API path "/api/news" contains /api prefix'
      );
      expect(() => validateApiPath("/api/employees")).toThrow(
        'API path "/api/employees" contains /api prefix'
      );
    });

    it("does not throw in production mode", () => {
      import.meta.env.DEV = false;
      expect(validateApiPath("/api/news")).toBe("/api/news");
      expect(validateApiPath("/news")).toBe("/news");
    });
  });

  describe("createApiPath", () => {
    beforeEach(() => {
      import.meta.env.DEV = true;
    });

    it("creates path from single segment", () => {
      expect(createApiPath("/news")).toBe("/news");
      expect(createApiPath("news")).toBe("/news");
    });

    it("creates path from multiple segments", () => {
      expect(createApiPath("/news", "123")).toBe("/news/123");
      expect(createApiPath("news", 123, "publish")).toBe("/news/123/publish");
    });

    it("handles numeric IDs", () => {
      expect(createApiPath("/employees", 456)).toBe("/employees/456");
      expect(createApiPath("/stamp", 789)).toBe("/stamp/789");
    });

    it("removes duplicate slashes", () => {
      expect(createApiPath("/news/", "/123")).toBe("/news/123");
      expect(createApiPath("news//123")).toBe("/news/123");
    });

    it("filters empty segments", () => {
      expect(createApiPath("/news", "", "123")).toBe("/news/123");
      expect(createApiPath("", "news", "", "123")).toBe("/news/123");
    });

    it("validates against /api prefix", () => {
      expect(() => createApiPath("/api/news")).toThrow(
        'API path "/api/news" contains /api prefix'
      );
    });

    it("creates complex paths correctly", () => {
      expect(createApiPath("news", 7, "publish")).toBe("/news/7/publish");
      expect(createApiPath("/employees", 123, "profile")).toBe(
        "/employees/123/profile"
      );
    });
  });
});
