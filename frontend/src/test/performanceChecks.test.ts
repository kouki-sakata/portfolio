import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  API_RESPONSE_THRESHOLDS,
  BUNDLE_BUDGET_KB,
  calculatePercentile,
  DEFAULT_LIGHTHOUSE_THRESHOLDS,
  evaluateApiPerformance,
  evaluateBundleBudget,
  evaluateLighthouseMetrics,
} from "@/shared/performance/performanceChecks";

describe("performance thresholds", () => {
  it("exposes a lighthouse performance score threshold of at least 0.9", () => {
    expect(
      DEFAULT_LIGHTHOUSE_THRESHOLDS.minPerformanceScore
    ).toBeGreaterThanOrEqual(0.9);
  });

  it("keeps the gzip bundle budget below 300KB", () => {
    expect(BUNDLE_BUDGET_KB).toBeLessThanOrEqual(300);
  });

  it("enforces API p95 below 200ms and p99 below 500ms", () => {
    expect(API_RESPONSE_THRESHOLDS.p95).toBeLessThanOrEqual(200);
    expect(API_RESPONSE_THRESHOLDS.p99).toBeLessThanOrEqual(500);
  });
});

describe("performance calculations", () => {
  it("calculates percentile using linear interpolation", () => {
    const sample = [100, 150, 200, 250, 300];
    expect(calculatePercentile(sample, 50)).toBe(200);
    expect(calculatePercentile(sample, 90)).toBe(280);
  });

  it("reports passing lighthouse metrics when thresholds are satisfied", () => {
    const result = evaluateLighthouseMetrics(
      {
        performanceScore: 0.95,
        largestContentfulPaintMs: 1200,
        timeToInteractiveMs: 1800,
      },
      DEFAULT_LIGHTHOUSE_THRESHOLDS
    );

    expect(result.passes).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("reports failure when lighthouse performance score drops below threshold", () => {
    const result = evaluateLighthouseMetrics(
      {
        performanceScore: 0.82,
        largestContentfulPaintMs: 1300,
        timeToInteractiveMs: 1700,
      },
      DEFAULT_LIGHTHOUSE_THRESHOLDS
    );

    expect(result.passes).toBe(false);
    expect(result.violations).toEqual([
      expect.stringContaining("performance score"),
    ]);
  });

  it("throws when lighthouse result is missing required metrics", () => {
    expect(() =>
      evaluateLighthouseMetrics(
        {
          performanceScore: 0.95,
          largestContentfulPaintMs: undefined,
          timeToInteractiveMs: 1700,
        } as unknown as Parameters<typeof evaluateLighthouseMetrics>[0],
        DEFAULT_LIGHTHOUSE_THRESHOLDS
      )
    ).toThrowError();
  });

  it("passes when bundle gzip total stays under budget", () => {
    const result = evaluateBundleBudget(
      [
        { filePath: "assets/index.js", gzipBytes: 120_000 },
        { filePath: "assets/vendor.js", gzipBytes: 150_000 },
      ],
      BUNDLE_BUDGET_KB
    );

    expect(result.passes).toBe(true);
    expect(result.totalGzipKb).toBeCloseTo(263.67, 2);
  });

  it("fails when bundle gzip total exceeds budget", () => {
    const result = evaluateBundleBudget(
      [
        { filePath: "assets/index.js", gzipBytes: 200_000 },
        { filePath: "assets/vendor.js", gzipBytes: 180_000 },
      ],
      BUNDLE_BUDGET_KB
    );

    expect(result.passes).toBe(false);
    expect(result.violations).toHaveLength(1);
  });

  it("computes api percentile metrics and reports pass/fail", () => {
    const sampleDurations = [120, 130, 140, 150, 160, 170, 175, 180, 185, 190];
    const report = evaluateApiPerformance(
      sampleDurations,
      API_RESPONSE_THRESHOLDS
    );

    expect(report.p95).toBeCloseTo(187.75, 2);
    expect(report.p99).toBeCloseTo(189.55, 2);
    expect(report.passes).toBe(true);
  });

  it("flags api metrics when percentiles exceed thresholds", () => {
    const sampleDurations = [200, 210, 220, 230, 240, 500, 510, 520, 530, 540];
    const report = evaluateApiPerformance(
      sampleDurations,
      API_RESPONSE_THRESHOLDS
    );

    expect(report.passes).toBe(false);
    expect(report.violations).toHaveLength(2);
  });
});

describe("lighthouse configuration files", () => {
  it("defines lighthouse assertions with performance threshold", () => {
    const configPath = join(process.cwd(), "lighthouserc.json");
    const configRaw = readFileSync(configPath, "utf-8");
    const config = JSON.parse(configRaw);
    const assertion = config.ci?.assert?.assertions?.["categories:performance"];
    expect(assertion).toBeDefined();
    const [, options] = assertion;
    expect(options.minScore).toBeGreaterThanOrEqual(
      DEFAULT_LIGHTHOUSE_THRESHOLDS.minPerformanceScore
    );
  });

  it("configures budgets file with LCP and bundle size limits", () => {
    const budgetsPath = join(
      process.cwd(),
      "performance",
      "performance-budgets.json"
    );
    const budgetsRaw = readFileSync(budgetsPath, "utf-8");
    const budgets = JSON.parse(budgetsRaw);

    expect(Array.isArray(budgets)).toBe(true);
    const lcpBudget = budgets[0]?.timings?.find(
      (item: { metric?: string }) => item.metric === "largest-contentful-paint"
    );
    expect(lcpBudget?.budget).toBeLessThanOrEqual(
      DEFAULT_LIGHTHOUSE_THRESHOLDS.maxLargestContentfulPaintMs
    );

    const scriptBudget = budgets[0]?.resourceSizes?.find(
      (item: { resourceType?: string }) => item.resourceType === "script"
    );
    expect(scriptBudget?.budget).toBeLessThanOrEqual(BUNDLE_BUDGET_KB);
  });
});
