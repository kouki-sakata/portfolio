#!/usr/bin/env node

/**
 * Generate mock baseline metrics for demonstration
 * This shows what the actual metrics would look like when collected from a running system
 */

const { collectDatabaseMetrics, generateBaselineMetrics } = require('./dist/collect-metrics.js');
const path = require('path');

// Mock API metrics (what we would get from Spring Boot Actuator)
const mockApiMetrics = {
  endpoints: {
    '/api/auth/login': { p95: 150, p99: 200, count: 1523 },
    '/api/auth/logout': { p95: 45, p99: 68, count: 892 },
    '/api/auth/session': { p95: 12, p99: 25, count: 8234 },
    '/api/stamp/in': { p95: 120, p99: 180, count: 3421 },
    '/api/stamp/out': { p95: 115, p99: 175, count: 3398 },
    '/api/stamp/history': { p95: 230, p99: 450, count: 1245 },
    '/api/employees': { p95: 180, p99: 320, count: 456 },
    '/api/news': { p95: 95, p99: 145, count: 2341 },
    '/api/dashboard': { p95: 350, p99: 580, count: 1892 }
  },
  overall: {
    p95: 143,
    p99: 238
  }
};

// Mock bundle metrics (what we would get from Vite build analysis)
const mockBundleMetrics = {
  js: {
    raw: 453678,     // ~443KB
    gzipped: 124532  // ~122KB
  },
  css: {
    raw: 82341,      // ~80KB
    gzipped: 19876   // ~19KB
  },
  total: {
    raw: 536019,     // ~523KB
    gzipped: 144408  // ~141KB
  }
};

async function generateMockBaseline() {
  try {
    console.log('Generating mock baseline metrics...\n');

    // Get real database metrics from our sample log
    const logPath = path.join(__dirname, '../../../../logs/teamdev-sample.log');
    const dbMetrics = await collectDatabaseMetrics(logPath);

    // Generate and save baseline
    const outputPath = path.join(__dirname, '../baseline-metrics.json');
    const specPath = path.join(__dirname, '../spec.json');

    await generateBaselineMetrics(
      mockApiMetrics,
      mockBundleMetrics,
      dbMetrics,
      outputPath,
      specPath
    );

    console.log('✅ Mock baseline metrics generated successfully!\n');
    console.log('Performance Summary:');
    console.log('====================');
    console.log(`API Response Times:`);
    console.log(`  - P95: ${mockApiMetrics.overall.p95}ms`);
    console.log(`  - P99: ${mockApiMetrics.overall.p99}ms`);
    console.log(`\nFrontend Bundle Sizes:`);
    console.log(`  - JavaScript: ${(mockBundleMetrics.js.gzipped / 1024).toFixed(2)}KB (gzipped)`);
    console.log(`  - CSS: ${(mockBundleMetrics.css.gzipped / 1024).toFixed(2)}KB (gzipped)`);
    console.log(`  - Total: ${(mockBundleMetrics.total.gzipped / 1024).toFixed(2)}KB (gzipped)`);
    console.log(`\nDatabase Query Performance:`);
    console.log(`  - Average query time: ${dbMetrics.overall.avg_query_time_ms}ms`);
    console.log(`  - P99 query time: ${dbMetrics.overall.p99_query_time_ms}ms`);
    console.log(`  - Slowest query avg: ${dbMetrics.slowest_queries[0]?.avg_time_ms || 0}ms`);
    console.log(`\n📊 Baseline metrics saved to: ${outputPath}`);
    console.log('📝 Spec.json updated with baseline reference');

  } catch (error) {
    console.error('❌ Error generating mock baseline:', error);
    process.exit(1);
  }
}

generateMockBaseline();