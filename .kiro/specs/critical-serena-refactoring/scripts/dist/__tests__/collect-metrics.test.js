"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const collect_metrics_1 = require("../collect-metrics");
const fs = __importStar(require("fs/promises"));
// Mock fetch and fs
global.fetch = vitest_1.vi.fn();
vitest_1.vi.mock('fs/promises');
vitest_1.vi.mock('child_process');
(0, vitest_1.describe)('Metrics Collection', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.restoreAllMocks();
    });
    (0, vitest_1.describe)('collectActuatorMetrics', () => {
        (0, vitest_1.it)('should collect API response time metrics from Spring Boot Actuator', async () => {
            // Arrange
            const mockActuatorResponse = {
                name: 'http.server.requests',
                measurements: [
                    { statistic: 'VALUE', value: 0.15 }, // p95
                    { statistic: 'MAX', value: 0.20 } // p99
                ],
                availableTags: [
                    { tag: 'uri', values: ['/api/auth/login', '/api/stamp'] }
                ]
            };
            const mockEndpointResponse = {
                name: 'http.server.requests',
                measurements: [
                    { statistic: '0.95', value: 0.15 },
                    { statistic: '0.99', value: 0.20 },
                    { statistic: 'COUNT', value: 1000 }
                ]
            };
            global.fetch
                .mockResolvedValueOnce({
                ok: true,
                json: async () => mockActuatorResponse
            })
                .mockResolvedValue({
                ok: true,
                json: async () => mockEndpointResponse
            });
            // Act
            const metrics = await (0, collect_metrics_1.collectActuatorMetrics)('http://localhost:8080');
            // Assert
            (0, vitest_1.expect)(metrics).toBeDefined();
            (0, vitest_1.expect)(metrics.endpoints).toHaveProperty('/api/auth/login');
            (0, vitest_1.expect)(metrics.endpoints['/api/auth/login']).toHaveProperty('p95');
            (0, vitest_1.expect)(metrics.endpoints['/api/auth/login']).toHaveProperty('p99');
            (0, vitest_1.expect)(metrics.overall).toHaveProperty('p95');
            (0, vitest_1.expect)(metrics.overall).toHaveProperty('p99');
        });
        (0, vitest_1.it)('should handle Actuator connection errors gracefully', async () => {
            // Arrange
            global.fetch.mockRejectedValue(new Error('Connection refused'));
            // Act & Assert
            await (0, vitest_1.expect)((0, collect_metrics_1.collectActuatorMetrics)('http://localhost:8080')).rejects.toThrow('Failed to collect Actuator metrics');
        });
    });
    (0, vitest_1.describe)('collectBundleMetrics', () => {
        (0, vitest_1.it)('should collect frontend bundle size metrics', async () => {
            // Arrange
            const mockStats = {
                '/path/to/index.js': { size: 450000, gzipSize: 120000 },
                '/path/to/index.css': { size: 80000, gzipSize: 20000 },
                '/path/to/vendor.js': { size: 300000, gzipSize: 80000 }
            };
            vitest_1.vi.mocked(fs.readdir).mockResolvedValue([
                'index-abc123.js',
                'index-def456.css',
                'vendor-ghi789.js'
            ]);
            vitest_1.vi.mocked(fs.stat).mockImplementation(async (filePath) => ({
                size: filePath.includes('.js')
                    ? (filePath.includes('vendor') ? 300000 : 450000)
                    : 80000,
                isFile: () => true
            }));
            vitest_1.vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
                // Return buffer for gzip compression
                const size = filePath.includes('.js')
                    ? (filePath.includes('vendor') ? 300000 : 450000)
                    : 80000;
                return Buffer.alloc(size, 'a');
            });
            // Act
            const metrics = await (0, collect_metrics_1.collectBundleMetrics)('./frontend/dist');
            // Assert
            (0, vitest_1.expect)(metrics).toBeDefined();
            (0, vitest_1.expect)(metrics.js.raw).toBeGreaterThan(0);
            (0, vitest_1.expect)(metrics.js.gzipped).toBeGreaterThan(0);
            (0, vitest_1.expect)(metrics.css.raw).toBeGreaterThan(0);
            (0, vitest_1.expect)(metrics.total.raw).toBe(metrics.js.raw + metrics.css.raw);
        });
        (0, vitest_1.it)('should handle missing dist directory gracefully', async () => {
            // Arrange
            vitest_1.vi.mocked(fs.readdir).mockRejectedValue(new Error('ENOENT: no such file or directory'));
            // Act & Assert
            await (0, vitest_1.expect)((0, collect_metrics_1.collectBundleMetrics)('./frontend/dist')).rejects.toThrow('Failed to collect bundle metrics');
        });
    });
    (0, vitest_1.describe)('collectDatabaseMetrics', () => {
        (0, vitest_1.it)('should parse MyBatis SQL logs and extract query performance metrics', async () => {
            // Arrange
            const mockLogContent = `
2025-10-09 10:00:01.123 [main] DEBUG com.example.teamdev.mapper.StampHistoryMapper - ==>  Preparing: SELECT * FROM stamp_history WHERE employee_id = ? [execution-time:45ms]
2025-10-09 10:00:02.456 [main] DEBUG com.example.teamdev.mapper.EmployeeMapper - ==>  Preparing: SELECT * FROM employees WHERE id = ? [execution-time:12ms]
2025-10-09 10:00:03.789 [main] DEBUG com.example.teamdev.mapper.StampHistoryMapper - ==>  Preparing: SELECT * FROM stamp_history WHERE employee_id = ? [execution-time:120ms]
      `;
            vitest_1.vi.mocked(fs.readFile).mockResolvedValue(mockLogContent);
            // Act
            const metrics = await (0, collect_metrics_1.collectDatabaseMetrics)('./logs/teamdev.log');
            // Assert
            (0, vitest_1.expect)(metrics).toBeDefined();
            (0, vitest_1.expect)(metrics.slowest_queries).toBeInstanceOf(Array);
            (0, vitest_1.expect)(metrics.slowest_queries.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(metrics.slowest_queries[0]).toHaveProperty('query');
            (0, vitest_1.expect)(metrics.slowest_queries[0]).toHaveProperty('avg_time_ms');
            (0, vitest_1.expect)(metrics.slowest_queries[0]).toHaveProperty('p99_time_ms');
            (0, vitest_1.expect)(metrics.overall.avg_query_time_ms).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should handle empty log files', async () => {
            // Arrange
            vitest_1.vi.mocked(fs.readFile).mockResolvedValue('');
            // Act
            const metrics = await (0, collect_metrics_1.collectDatabaseMetrics)('./logs/teamdev.log');
            // Assert
            (0, vitest_1.expect)(metrics.slowest_queries).toEqual([]);
            (0, vitest_1.expect)(metrics.overall.avg_query_time_ms).toBe(0);
            (0, vitest_1.expect)(metrics.overall.p99_query_time_ms).toBe(0);
        });
    });
    (0, vitest_1.describe)('generateBaselineMetrics', () => {
        (0, vitest_1.it)('should generate complete baseline metrics JSON file', async () => {
            // Arrange
            const mockApiMetrics = {
                endpoints: {
                    '/api/auth/login': { p95: 150, p99: 200, count: 1000 },
                    '/api/stamp': { p95: 120, p99: 180, count: 5000 }
                },
                overall: { p95: 130, p99: 190 }
            };
            const mockBundleMetrics = {
                js: { raw: 450000, gzipped: 120000 },
                css: { raw: 80000, gzipped: 20000 },
                total: { raw: 530000, gzipped: 140000 }
            };
            const mockDbMetrics = {
                slowest_queries: [
                    {
                        query: 'SELECT * FROM stamp_history WHERE employee_id = ?',
                        avg_time_ms: 45,
                        p99_time_ms: 120,
                        count: 3000
                    }
                ],
                overall: { avg_query_time_ms: 15, p99_query_time_ms: 50 }
            };
            // Mock the individual collection functions
            vitest_1.vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            // Act
            const baseline = await (0, collect_metrics_1.generateBaselineMetrics)(mockApiMetrics, mockBundleMetrics, mockDbMetrics, './baseline-metrics.json');
            // Assert
            (0, vitest_1.expect)(baseline).toBeDefined();
            (0, vitest_1.expect)(baseline.timestamp).toBeDefined();
            (0, vitest_1.expect)(baseline.api_metrics).toEqual(mockApiMetrics);
            (0, vitest_1.expect)(baseline.frontend_bundle).toEqual(mockBundleMetrics);
            (0, vitest_1.expect)(baseline.database_queries).toEqual(mockDbMetrics);
            (0, vitest_1.expect)(fs.writeFile).toHaveBeenCalledWith('./baseline-metrics.json', vitest_1.expect.stringContaining('"api_metrics"'), 'utf-8');
        });
        (0, vitest_1.it)('should update spec.json with baseline reference', async () => {
            // Arrange
            const mockSpecJson = {
                feature_name: 'critical-serena-refactoring',
                phase: 'tasks-generated'
            };
            vitest_1.vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSpecJson));
            vitest_1.vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            // Act
            await (0, collect_metrics_1.generateBaselineMetrics)({}, {}, {}, './baseline-metrics.json', './spec.json');
            // Assert
            (0, vitest_1.expect)(fs.writeFile).toHaveBeenCalledWith('./spec.json', vitest_1.expect.stringContaining('"baseline_metrics"'), 'utf-8');
        });
    });
    (0, vitest_1.describe)('Integration Tests', () => {
        (0, vitest_1.it)('should collect all metrics and generate baseline successfully', async () => {
            // This is an integration test that would run the complete workflow
            // In a real scenario, this would be run against a running application
            // Arrange - Mock all external dependencies for parallel execution
            global.fetch.mockResolvedValue({
                ok: true,
                json: async () => ({
                    name: 'http.server.requests',
                    measurements: [
                        { statistic: 'VALUE', value: 0.15 },
                        { statistic: 'MAX', value: 0.20 }
                    ],
                    availableTags: []
                })
            });
            vitest_1.vi.mocked(fs.readdir).mockResolvedValue(['index.js', 'index.css']);
            vitest_1.vi.mocked(fs.stat).mockResolvedValue({ size: 100000, isFile: () => true });
            vitest_1.vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
                if (typeof filePath === 'string' && filePath.includes('spec.json')) {
                    return JSON.stringify({ feature_name: 'critical-serena-refactoring' });
                }
                else if (typeof filePath === 'string' && filePath.includes('.log')) {
                    return 'SQL log content';
                }
                else {
                    // Return buffer for other files
                    return Buffer.alloc(100000, 'a');
                }
            });
            vitest_1.vi.mocked(fs.writeFile).mockResolvedValue(undefined);
            // Act - This would be the main entry point
            const { collectAndSaveMetrics } = await Promise.resolve().then(() => __importStar(require('../collect-metrics')));
            const result = await collectAndSaveMetrics({
                actuatorUrl: 'http://localhost:8080',
                bundlePath: './frontend/dist',
                logPath: './logs/teamdev.log',
                outputPath: './baseline-metrics.json',
                specPath: './spec.json'
            });
            // Assert
            (0, vitest_1.expect)(result).toBe(true);
            (0, vitest_1.expect)(fs.writeFile).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=collect-metrics.test.js.map