#!/usr/bin/env node

/**
 * Test script for metrics collection
 * This demonstrates how to collect performance baseline metrics
 */

const { collectAndSaveMetrics } = require('./dist/collect-metrics.js');
const path = require('path');

const options = {
  // Actuator URL - in development, this would be the running Spring Boot app
  actuatorUrl: process.env.ACTUATOR_URL || 'http://localhost:8080',

  // Frontend bundle path - where Vite outputs the built files
  bundlePath: path.join(__dirname, '../../../../frontend/dist'),

  // Log path - using our sample log file for testing
  logPath: path.join(__dirname, '../../../../logs/teamdev-sample.log'),

  // Output path for the baseline metrics
  outputPath: path.join(__dirname, '../baseline-metrics.json'),

  // Spec path to update
  specPath: path.join(__dirname, '../spec.json')
};

console.log('Testing metrics collection with sample data...\n');
console.log('Configuration:');
console.log('- Actuator URL:', options.actuatorUrl);
console.log('- Bundle Path:', options.bundlePath);
console.log('- Log Path:', options.logPath);
console.log('- Output Path:', options.outputPath);
console.log('- Spec Path:', options.specPath);
console.log('\n');

// Note: This will fail for Actuator metrics if Spring Boot isn't running
// But it will successfully parse the log file we created
collectAndSaveMetrics(options)
  .then(success => {
    if (success) {
      console.log('\n✅ Metrics collection test completed successfully!');
      console.log('Check the baseline-metrics.json file for results.');
    } else {
      console.log('\n❌ Metrics collection test failed.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Error during metrics collection:', error);
    process.exit(1);
  });