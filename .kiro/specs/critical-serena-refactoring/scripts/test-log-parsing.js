#!/usr/bin/env node

/**
 * Test script for log parsing functionality
 * This demonstrates how MyBatis SQL logs are parsed for performance metrics
 */

const { collectDatabaseMetrics } = require('./dist/collect-metrics.js');
const path = require('path');

const logPath = path.join(__dirname, '../../../../logs/teamdev-sample.log');

console.log('Testing MyBatis SQL log parsing...\n');
console.log('Log file:', logPath);
console.log('\n');

collectDatabaseMetrics(logPath)
  .then(metrics => {
    console.log('✅ Successfully parsed SQL logs!\n');
    console.log('Database Query Metrics:');
    console.log('=======================');
    console.log(`Overall average query time: ${metrics.overall.avg_query_time_ms}ms`);
    console.log(`Overall p99 query time: ${metrics.overall.p99_query_time_ms}ms`);
    console.log('\nSlowest Queries:');
    console.log('----------------');

    metrics.slowest_queries.forEach((query, index) => {
      console.log(`\n${index + 1}. ${query.query.substring(0, 60)}...`);
      console.log(`   Average time: ${query.avg_time_ms}ms`);
      console.log(`   P99 time: ${query.p99_time_ms}ms`);
      console.log(`   Execution count: ${query.count}`);
    });
  })
  .catch(error => {
    console.error('❌ Error parsing logs:', error);
    process.exit(1);
  });