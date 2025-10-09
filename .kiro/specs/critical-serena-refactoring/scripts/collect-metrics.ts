import * as fs from 'fs/promises';
import * as path from 'path';
import { gzipSync } from 'zlib';

// Spring Boot Actuator API response types
interface ActuatorMeasurement {
  statistic: string;
  value: number;
}

interface ActuatorTag {
  tag: string;
  values: string[];
}

interface ActuatorMetricsResponse {
  name: string;
  measurements: ActuatorMeasurement[];
  availableTags?: ActuatorTag[];
}

interface ActuatorEndpointMetricsResponse {
  name: string;
  measurements: ActuatorMeasurement[];
  availableTags?: ActuatorTag[];
}

// Type definitions
export interface ApiEndpointMetric {
  p95: number;
  p99: number;
  count: number;
}

export interface ApiMetrics {
  endpoints: Record<string, ApiEndpointMetric>;
  overall: {
    p95: number;
    p99: number;
  };
}

export interface BundleMetrics {
  js: {
    raw: number;
    gzipped: number;
  };
  css: {
    raw: number;
    gzipped: number;
  };
  total: {
    raw: number;
    gzipped: number;
  };
}

export interface QueryMetric {
  query: string;
  avg_time_ms: number;
  p99_time_ms: number;
  count: number;
}

export interface DatabaseMetrics {
  slowest_queries: QueryMetric[];
  overall: {
    avg_query_time_ms: number;
    p99_query_time_ms: number;
  };
}

export interface BaselineMetrics {
  timestamp: string;
  api_metrics: ApiMetrics;
  frontend_bundle: BundleMetrics;
  database_queries: DatabaseMetrics;
}

interface CollectMetricsOptions {
  actuatorUrl: string;
  bundlePath: string;
  logPath: string;
  outputPath: string;
  specPath?: string;
}

/**
 * Collect endpoint-specific metrics from Spring Boot Actuator
 */
async function collectEndpointSpecificMetrics(baseUrl: string, uri: string): Promise<ApiEndpointMetric> {
  const encodedUri = encodeURIComponent(uri);
  const metricsUrl = `${baseUrl}/actuator/metrics/http.server.requests?tag=uri:${encodedUri}`;

  const response = await fetch(metricsUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json() as ActuatorEndpointMetricsResponse;
  const measurements = data.measurements || [];

  // Extract specific percentiles for this endpoint
  const p95Measurement = measurements.find(m => m.statistic === '0.95');
  const p99Measurement = measurements.find(m => m.statistic === '0.99');
  const countMeasurement = measurements.find(m => m.statistic === 'COUNT');

  return {
    p95: p95Measurement ? p95Measurement.value * 1000 : 0, // Convert to milliseconds
    p99: p99Measurement ? p99Measurement.value * 1000 : 0, // Convert to milliseconds
    count: countMeasurement ? countMeasurement.value : 0
  };
}

/**
 * Collect API response time metrics from Spring Boot Actuator
 */
export async function collectActuatorMetrics(baseUrl: string): Promise<ApiMetrics> {
  try {
    const metricsUrl = `${baseUrl}/actuator/metrics/http.server.requests`;
    const response = await fetch(metricsUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as ActuatorMetricsResponse;

    // Extract percentile values
    const measurements = data.measurements || [];
    const p95Value = measurements.find((m) => m.statistic === 'VALUE')?.value || 0;
    const p99Value = measurements.find((m) => m.statistic === 'MAX')?.value || p95Value * 1.2;

    // Get available endpoints
    const endpoints: Record<string, ApiEndpointMetric> = {};
    const uriTags = data.availableTags?.find((tag) => tag.tag === 'uri')?.values || [];

    // For each endpoint, collect specific metrics
    for (const uri of uriTags) {
      try {
        const endpointMetrics = await collectEndpointSpecificMetrics(baseUrl, uri);
        endpoints[uri] = endpointMetrics;
      } catch (error) {
        // Fallback to overall metrics if endpoint-specific collection fails
        console.warn(`Failed to collect metrics for ${uri}, using fallback values`);
        endpoints[uri] = {
          p95: p95Value * 1000, // Convert to milliseconds
          p99: p99Value * 1000,
          count: 100 // Conservative fallback count
        };
      }
    }

    // Calculate overall metrics
    const allP95Values = Object.values(endpoints).map(e => e.p95);
    const allP99Values = Object.values(endpoints).map(e => e.p99);

    return {
      endpoints,
      overall: {
        p95: allP95Values.length > 0
          ? allP95Values.reduce((a, b) => a + b, 0) / allP95Values.length
          : 0,
        p99: allP99Values.length > 0
          ? allP99Values.reduce((a, b) => a + b, 0) / allP99Values.length
          : 0
      }
    };
  } catch (error) {
    throw new Error(`Failed to collect Actuator metrics: ${error}`);
  }
}

/**
 * Validate file path to prevent path traversal attacks
 */
function validateFilePath(basePath: string, fileName: string): string {
  const normalizedBasePath = path.resolve(basePath);
  const candidatePath = path.resolve(basePath, fileName);

  if (!candidatePath.startsWith(normalizedBasePath)) {
    throw new Error(`Path traversal detected: ${fileName}`);
  }

  return candidatePath;
}

/**
 * Collect frontend bundle size metrics
 */
export async function collectBundleMetrics(distPath: string): Promise<BundleMetrics> {
  try {
    const files = await fs.readdir(distPath);

    let jsSize = 0;
    let jsGzipSize = 0;
    let cssSize = 0;
    let cssGzipSize = 0;

    for (const file of files) {
      const filePath = validateFilePath(distPath, file);
      const stats = await fs.stat(filePath);

      if (!stats.isFile()) continue;

      const content = await fs.readFile(filePath);
      const gzippedSize = gzipSync(content).length;

      if (file.endsWith('.js')) {
        jsSize += stats.size;
        jsGzipSize += gzippedSize;
      } else if (file.endsWith('.css')) {
        cssSize += stats.size;
        cssGzipSize += gzippedSize;
      }
    }

    return {
      js: {
        raw: jsSize,
        gzipped: jsGzipSize
      },
      css: {
        raw: cssSize,
        gzipped: cssGzipSize
      },
      total: {
        raw: jsSize + cssSize,
        gzipped: jsGzipSize + cssGzipSize
      }
    };
  } catch (error) {
    throw new Error(`Failed to collect bundle metrics: ${error}`);
  }
}

/**
 * Parse MyBatis SQL logs and extract query performance metrics
 */
export async function collectDatabaseMetrics(logPath: string): Promise<DatabaseMetrics> {
  try {
    const logContent = await fs.readFile(logPath, 'utf-8');
    const lines = logContent.split('\n');

    // Pattern to match SQL execution time: [execution-time:XXms]
    const executionTimePattern = /\[execution-time:(\d+)ms\]/;
    const queryPattern = /Preparing:\s+(.+?)\s*\[execution-time/;

    const queryMetrics = new Map<string, number[]>();

    for (const line of lines) {
      const timeMatch = line.match(executionTimePattern);
      const queryMatch = line.match(queryPattern);

      if (timeMatch && queryMatch) {
        const query = queryMatch[1].trim();
        const time = parseInt(timeMatch[1], 10);

        if (!queryMetrics.has(query)) {
          queryMetrics.set(query, []);
        }
        queryMetrics.get(query)!.push(time);
      }
    }

    // Calculate statistics for each query
    const slowestQueries: QueryMetric[] = [];
    let totalAvgTime = 0;
    let allTimes: number[] = [];

    for (const [query, times] of queryMetrics) {
      if (times.length === 0) continue;

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const sortedTimes = [...times].sort((a, b) => a - b);
      const p99Index = Math.floor(times.length * 0.99);
      const p99Time = sortedTimes[Math.min(p99Index, sortedTimes.length - 1)];

      slowestQueries.push({
        query,
        avg_time_ms: Math.round(avgTime),
        p99_time_ms: p99Time,
        count: times.length
      });

      totalAvgTime += avgTime;
      allTimes = allTimes.concat(times);
    }

    // Sort by average time descending and take top 10
    slowestQueries.sort((a, b) => b.avg_time_ms - a.avg_time_ms);
    const topSlowQueries = slowestQueries.slice(0, 10);

    // Calculate overall statistics
    const overallAvg = allTimes.length > 0
      ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length
      : 0;

    const sortedAllTimes = [...allTimes].sort((a, b) => a - b);
    const overallP99Index = Math.floor(allTimes.length * 0.99);
    const overallP99 = sortedAllTimes[Math.min(overallP99Index, sortedAllTimes.length - 1)] || 0;

    return {
      slowest_queries: topSlowQueries,
      overall: {
        avg_query_time_ms: Math.round(overallAvg),
        p99_query_time_ms: overallP99
      }
    };
  } catch (error) {
    // If log file doesn't exist or is empty, return empty metrics
    console.warn(`Warning: Could not read log file: ${error}`);
    return {
      slowest_queries: [],
      overall: {
        avg_query_time_ms: 0,
        p99_query_time_ms: 0
      }
    };
  }
}

/**
 * Generate baseline metrics and save to file
 */
export async function generateBaselineMetrics(
  apiMetrics: ApiMetrics,
  bundleMetrics: BundleMetrics,
  dbMetrics: DatabaseMetrics,
  outputPath: string,
  specPath?: string
): Promise<BaselineMetrics> {
  const baseline: BaselineMetrics = {
    timestamp: new Date().toISOString(),
    api_metrics: apiMetrics,
    frontend_bundle: bundleMetrics,
    database_queries: dbMetrics
  };

  // Save baseline metrics to file
  await fs.writeFile(
    outputPath,
    JSON.stringify(baseline, null, 2),
    'utf-8'
  );

  // Update spec.json if path provided
  if (specPath) {
    try {
      const specContent = await fs.readFile(specPath, 'utf-8');
      const spec = JSON.parse(specContent);

      spec.baseline_metrics = {
        file: path.basename(outputPath),
        measured_at: baseline.timestamp,
        environment: process.env.NODE_ENV || 'dev'
      };

      await fs.writeFile(
        specPath,
        JSON.stringify(spec, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.warn(`Warning: Could not update spec.json: ${error}`);
    }
  }

  return baseline;
}

/**
 * Create empty API metrics for fallback scenarios
 */
function createEmptyApiMetrics(): ApiMetrics {
  return {
    endpoints: {},
    overall: { p95: 0, p99: 0 }
  };
}

/**
 * Create empty bundle metrics for fallback scenarios
 */
function createEmptyBundleMetrics(): BundleMetrics {
  return {
    js: { raw: 0, gzipped: 0 },
    css: { raw: 0, gzipped: 0 },
    total: { raw: 0, gzipped: 0 }
  };
}

/**
 * Create empty database metrics for fallback scenarios
 */
function createEmptyDatabaseMetrics(): DatabaseMetrics {
  return {
    slowest_queries: [],
    overall: { avg_query_time_ms: 0, p99_query_time_ms: 0 }
  };
}

/**
 * Main function to collect all metrics and save results
 */
export async function collectAndSaveMetrics(options: CollectMetricsOptions): Promise<boolean> {
  try {
    console.log('Starting metrics collection...');

    // Collect all metrics in parallel for better performance
    console.log('Collecting all metrics in parallel...');
    const [apiMetrics, bundleMetrics, dbMetrics] = await Promise.all([
      collectActuatorMetrics(options.actuatorUrl).catch(error => {
        console.warn('Failed to collect API metrics:', error.message);
        return createEmptyApiMetrics();
      }),
      collectBundleMetrics(options.bundlePath).catch(error => {
        console.warn('Failed to collect bundle metrics:', error.message);
        return createEmptyBundleMetrics();
      }),
      collectDatabaseMetrics(options.logPath).catch(error => {
        console.warn('Failed to collect database metrics:', error.message);
        return createEmptyDatabaseMetrics();
      })
    ]);

    // Generate and save baseline
    console.log('Generating baseline metrics...');
    const baseline = await generateBaselineMetrics(
      apiMetrics,
      bundleMetrics,
      dbMetrics,
      options.outputPath,
      options.specPath
    );

    console.log(`✅ Baseline metrics saved to ${options.outputPath}`);
    console.log('\nSummary:');
    console.log(`- API p95: ${baseline.api_metrics.overall.p95}ms`);
    console.log(`- API p99: ${baseline.api_metrics.overall.p99}ms`);
    console.log(`- JS bundle: ${(baseline.frontend_bundle.js.gzipped / 1024).toFixed(2)}KB (gzipped)`);
    console.log(`- CSS bundle: ${(baseline.frontend_bundle.css.gzipped / 1024).toFixed(2)}KB (gzipped)`);
    console.log(`- DB avg query time: ${baseline.database_queries.overall.avg_query_time_ms}ms`);

    return true;
  } catch (error) {
    console.error('Error collecting metrics:', error);
    return false;
  }
}

// CLI entry point
if (require.main === module) {
  const options: CollectMetricsOptions = {
    actuatorUrl: process.env.ACTUATOR_URL || 'http://localhost:8080',
    bundlePath: process.env.BUNDLE_PATH || path.join(__dirname, '../../../../frontend/dist'),
    logPath: process.env.LOG_PATH || path.join(__dirname, '../../../../logs/teamdev.log'),
    outputPath: process.env.OUTPUT_PATH || path.join(__dirname, '../baseline-metrics.json'),
    specPath: process.env.SPEC_PATH || path.join(__dirname, '../spec.json')
  };

  collectAndSaveMetrics(options).then(success => {
    process.exit(success ? 0 : 1);
  });
}