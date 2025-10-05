export type LighthouseThresholds = {
  readonly minPerformanceScore: number;
  readonly maxLargestContentfulPaintMs: number;
  readonly maxTimeToInteractiveMs: number;
};

export type LighthouseMetrics = {
  readonly performanceScore: number;
  readonly largestContentfulPaintMs: number;
  readonly timeToInteractiveMs: number;
};

export type LighthouseEvaluationResult = {
  readonly passes: boolean;
  readonly violations: readonly string[];
  readonly metrics: LighthouseMetrics;
};

export const DEFAULT_LIGHTHOUSE_THRESHOLDS: LighthouseThresholds = {
  minPerformanceScore: 0.9,
  maxLargestContentfulPaintMs: 1500,
  maxTimeToInteractiveMs: 2000,
};

const assertIsFiniteNumber = (
  value: number | undefined,
  field: string
): number => {
  if (value === undefined || Number.isNaN(value)) {
    throw new Error(`Missing or invalid ${field}`);
  }

  return value;
};

export const evaluateLighthouseMetrics = (
  metrics: LighthouseMetrics,
  thresholds: LighthouseThresholds = DEFAULT_LIGHTHOUSE_THRESHOLDS
): LighthouseEvaluationResult => {
  const performanceScore = assertIsFiniteNumber(
    metrics.performanceScore,
    "performanceScore"
  );
  const largestContentfulPaintMs = assertIsFiniteNumber(
    metrics.largestContentfulPaintMs,
    "largestContentfulPaintMs"
  );
  const timeToInteractiveMs = assertIsFiniteNumber(
    metrics.timeToInteractiveMs,
    "timeToInteractiveMs"
  );

  const violations: string[] = [];

  if (performanceScore < thresholds.minPerformanceScore) {
    violations.push(
      `Lighthouse performance score ${performanceScore.toFixed(2)} is below required ${thresholds.minPerformanceScore.toFixed(2)}`
    );
  }

  if (largestContentfulPaintMs > thresholds.maxLargestContentfulPaintMs) {
    violations.push(
      `Largest Contentful Paint ${largestContentfulPaintMs.toFixed(0)}ms exceeds ${thresholds.maxLargestContentfulPaintMs.toFixed(0)}ms`
    );
  }

  if (timeToInteractiveMs > thresholds.maxTimeToInteractiveMs) {
    violations.push(
      `Time to Interactive ${timeToInteractiveMs.toFixed(0)}ms exceeds ${thresholds.maxTimeToInteractiveMs.toFixed(0)}ms`
    );
  }

  return {
    passes: violations.length === 0,
    violations,
    metrics: {
      performanceScore,
      largestContentfulPaintMs,
      timeToInteractiveMs,
    },
  };
};

const sortNumeric = (first: number, second: number): number => first - second;

const assertArrayElement = (
  array: readonly number[],
  index: number,
  context: string
): number => {
  const value = array[index];
  if (value === undefined) {
    throw new Error(
      `Array element at index ${index} is undefined (${context})`
    );
  }
  return value;
};

export const calculatePercentile = (
  samples: readonly number[],
  percentile: number
): number => {
  if (samples.length === 0) {
    throw new Error("Cannot calculate percentile for empty sample set");
  }

  if (Number.isNaN(percentile) || percentile < 0 || percentile > 100) {
    throw new RangeError(
      `Percentile must be between 0 and 100. Received ${percentile}`
    );
  }

  if (samples.length === 1) {
    return assertArrayElement(samples, 0, "single sample");
  }

  const sorted = [...samples].sort(sortNumeric);
  const rank = (percentile / 100) * (sorted.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);

  if (lowerIndex === upperIndex) {
    return assertArrayElement(sorted, lowerIndex, "percentile calculation");
  }

  const lowerValue = assertArrayElement(sorted, lowerIndex, "lower bound");
  const upperValue = assertArrayElement(sorted, upperIndex, "upper bound");
  const weight = rank - lowerIndex;

  return lowerValue + (upperValue - lowerValue) * weight;
};

export type BundleAssetMetric = {
  readonly filePath: string;
  readonly gzipBytes: number;
  readonly originalBytes?: number;
};

export type BundleBudgetResult = {
  readonly passes: boolean;
  readonly totalGzipKb: number;
  readonly violations: readonly string[];
};

export const BUNDLE_BUDGET_KB = 300;

export const evaluateBundleBudget = (
  assets: readonly BundleAssetMetric[],
  budgetKb: number = BUNDLE_BUDGET_KB
): BundleBudgetResult => {
  if (assets.length === 0) {
    return { passes: true, totalGzipKb: 0, violations: [] };
  }

  const totalGzipBytes = assets.reduce(
    (accumulator, asset) => accumulator + asset.gzipBytes,
    0
  );
  const totalGzipKb = totalGzipBytes / 1024;
  const passes = totalGzipKb <= budgetKb;

  return {
    passes,
    totalGzipKb,
    violations: passes
      ? []
      : [
          `Total gzip size ${totalGzipKb.toFixed(2)}KB exceeds budget ${budgetKb.toFixed(2)}KB`,
        ],
  };
};

export type ApiPerformanceThresholds = {
  readonly p95: number;
  readonly p99: number;
};

export type ApiPerformanceReport = {
  readonly passes: boolean;
  readonly p95: number;
  readonly p99: number;
  readonly sampleCount: number;
  readonly violations: readonly string[];
};

export const API_RESPONSE_THRESHOLDS: ApiPerformanceThresholds = {
  p95: 200,
  p99: 500,
};

const sanitizeSamples = (samples: readonly number[]): number[] =>
  samples.filter((value) => Number.isFinite(value));

export const evaluateApiPerformance = (
  samples: readonly number[],
  thresholds: ApiPerformanceThresholds = API_RESPONSE_THRESHOLDS
): ApiPerformanceReport => {
  const sanitized = sanitizeSamples(samples);

  if (sanitized.length === 0) {
    throw new Error("No valid API response samples provided");
  }

  const p95 = calculatePercentile(sanitized, 95);
  const p99 = calculatePercentile(sanitized, 99);

  const violations: string[] = [];

  if (p95 > thresholds.p95) {
    violations.push(
      `p95 response time ${p95.toFixed(2)}ms exceeds threshold ${thresholds.p95.toFixed(2)}ms`
    );
  }

  if (p99 > thresholds.p99) {
    violations.push(
      `p99 response time ${p99.toFixed(2)}ms exceeds threshold ${thresholds.p99.toFixed(2)}ms`
    );
  }

  return {
    passes: violations.length === 0,
    p95,
    p99,
    sampleCount: sanitized.length,
    violations,
  };
};
