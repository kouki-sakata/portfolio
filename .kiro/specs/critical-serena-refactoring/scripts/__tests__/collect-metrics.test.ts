import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Mock } from 'vitest';
import {
  collectActuatorMetrics,
  collectBundleMetrics,
  collectDatabaseMetrics,
  generateBaselineMetrics,
  type ApiMetrics,
  type BundleMetrics,
  type DatabaseMetrics,
  type BaselineMetrics
} from '../collect-metrics';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock fetch and fs
global.fetch = vi.fn() as Mock;
vi.mock('fs/promises');
vi.mock('child_process');

describe('Metrics Collection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('collectActuatorMetrics', () => {
    it('should collect API response time metrics from Spring Boot Actuator', async () => {
      // Arrange
      const mockActuatorResponse = {
        name: 'http.server.requests',
        measurements: [
          { statistic: 'VALUE', value: 0.15 }, // p95
          { statistic: 'MAX', value: 0.20 }    // p99
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

      (global.fetch as Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockActuatorResponse
        })
        .mockResolvedValue({
          ok: true,
          json: async () => mockEndpointResponse
        });

      // Act
      const metrics = await collectActuatorMetrics('http://localhost:8080');

      // Assert
      expect(metrics).toBeDefined();
      expect(metrics.endpoints).toHaveProperty('/api/auth/login');
      expect(metrics.endpoints['/api/auth/login']).toHaveProperty('p95');
      expect(metrics.endpoints['/api/auth/login']).toHaveProperty('p99');
      expect(metrics.overall).toHaveProperty('p95');
      expect(metrics.overall).toHaveProperty('p99');
    });

    it('should handle Actuator connection errors gracefully', async () => {
      // Arrange
      (global.fetch as Mock).mockRejectedValue(new Error('Connection refused'));

      // Act & Assert
      await expect(collectActuatorMetrics('http://localhost:8080')).rejects.toThrow(
        'Failed to collect Actuator metrics'
      );
    });
  });

  describe('collectBundleMetrics', () => {
    it('should collect frontend bundle size metrics', async () => {
      // Arrange
      const mockStats = {
        '/path/to/index.js': { size: 450000, gzipSize: 120000 },
        '/path/to/index.css': { size: 80000, gzipSize: 20000 },
        '/path/to/vendor.js': { size: 300000, gzipSize: 80000 }
      };

      vi.mocked(fs.readdir).mockResolvedValue([
        'index-abc123.js',
        'index-def456.css',
        'vendor-ghi789.js'
      ] as unknown as any[]);

      vi.mocked(fs.stat).mockImplementation(async (filePath: any) => ({
        size: filePath.includes('.js')
          ? (filePath.includes('vendor') ? 300000 : 450000)
          : 80000,
        isFile: () => true
      } as any));

      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        // Return buffer for gzip compression
        const size = filePath.includes('.js')
          ? (filePath.includes('vendor') ? 300000 : 450000)
          : 80000;
        return Buffer.alloc(size, 'a');
      });

      // Act
      const metrics = await collectBundleMetrics('./frontend/dist');

      // Assert
      expect(metrics).toBeDefined();
      expect(metrics.js.raw).toBeGreaterThan(0);
      expect(metrics.js.gzipped).toBeGreaterThan(0);
      expect(metrics.css.raw).toBeGreaterThan(0);
      expect(metrics.total.raw).toBe(metrics.js.raw + metrics.css.raw);
    });

    it('should handle missing dist directory gracefully', async () => {
      // Arrange
      vi.mocked(fs.readdir).mockRejectedValue(
        new Error('ENOENT: no such file or directory')
      );

      // Act & Assert
      await expect(collectBundleMetrics('./frontend/dist')).rejects.toThrow(
        'Failed to collect bundle metrics'
      );
    });
  });

  describe('collectDatabaseMetrics', () => {
    it('should parse MyBatis SQL logs and extract query performance metrics', async () => {
      // Arrange
      const mockLogContent = `
2025-10-09 10:00:01.123 [main] DEBUG com.example.teamdev.mapper.StampHistoryMapper - ==>  Preparing: SELECT * FROM stamp_history WHERE employee_id = ? [execution-time:45ms]
2025-10-09 10:00:02.456 [main] DEBUG com.example.teamdev.mapper.EmployeeMapper - ==>  Preparing: SELECT * FROM employees WHERE id = ? [execution-time:12ms]
2025-10-09 10:00:03.789 [main] DEBUG com.example.teamdev.mapper.StampHistoryMapper - ==>  Preparing: SELECT * FROM stamp_history WHERE employee_id = ? [execution-time:120ms]
      `;

      vi.mocked(fs.readFile).mockResolvedValue(mockLogContent);

      // Act
      const metrics = await collectDatabaseMetrics('./logs/teamdev.log');

      // Assert
      expect(metrics).toBeDefined();
      expect(metrics.slowest_queries).toBeInstanceOf(Array);
      expect(metrics.slowest_queries.length).toBeGreaterThan(0);
      expect(metrics.slowest_queries[0]).toHaveProperty('query');
      expect(metrics.slowest_queries[0]).toHaveProperty('avg_time_ms');
      expect(metrics.slowest_queries[0]).toHaveProperty('p99_time_ms');
      expect(metrics.overall.avg_query_time_ms).toBeGreaterThan(0);
    });

    it('should handle empty log files', async () => {
      // Arrange
      vi.mocked(fs.readFile).mockResolvedValue('');

      // Act
      const metrics = await collectDatabaseMetrics('./logs/teamdev.log');

      // Assert
      expect(metrics.slowest_queries).toEqual([]);
      expect(metrics.overall.avg_query_time_ms).toBe(0);
      expect(metrics.overall.p99_query_time_ms).toBe(0);
    });
  });

  describe('generateBaselineMetrics', () => {
    it('should generate complete baseline metrics JSON file', async () => {
      // Arrange
      const mockApiMetrics: ApiMetrics = {
        endpoints: {
          '/api/auth/login': { p95: 150, p99: 200, count: 1000 },
          '/api/stamp': { p95: 120, p99: 180, count: 5000 }
        },
        overall: { p95: 130, p99: 190 }
      };

      const mockBundleMetrics: BundleMetrics = {
        js: { raw: 450000, gzipped: 120000 },
        css: { raw: 80000, gzipped: 20000 },
        total: { raw: 530000, gzipped: 140000 }
      };

      const mockDbMetrics: DatabaseMetrics = {
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
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      // Act
      const baseline = await generateBaselineMetrics(
        mockApiMetrics,
        mockBundleMetrics,
        mockDbMetrics,
        './baseline-metrics.json'
      );

      // Assert
      expect(baseline).toBeDefined();
      expect(baseline.timestamp).toBeDefined();
      expect(baseline.api_metrics).toEqual(mockApiMetrics);
      expect(baseline.frontend_bundle).toEqual(mockBundleMetrics);
      expect(baseline.database_queries).toEqual(mockDbMetrics);

      expect(fs.writeFile).toHaveBeenCalledWith(
        './baseline-metrics.json',
        expect.stringContaining('"api_metrics"'),
        'utf-8'
      );
    });

    it('should update spec.json with baseline reference', async () => {
      // Arrange
      const mockSpecJson = {
        feature_name: 'critical-serena-refactoring',
        phase: 'tasks-generated'
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockSpecJson));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      // Act
      await generateBaselineMetrics(
        {} as ApiMetrics,
        {} as BundleMetrics,
        {} as DatabaseMetrics,
        './baseline-metrics.json',
        './spec.json'
      );

      // Assert
      expect(fs.writeFile).toHaveBeenCalledWith(
        './spec.json',
        expect.stringContaining('"baseline_metrics"'),
        'utf-8'
      );
    });
  });

  describe('Integration Tests', () => {
    it('should collect all metrics and generate baseline successfully', async () => {
      // This is an integration test that would run the complete workflow
      // In a real scenario, this would be run against a running application

      // Arrange - Mock all external dependencies for parallel execution
      (global.fetch as Mock).mockResolvedValue({
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

      vi.mocked(fs.readdir).mockResolvedValue(['index.js', 'index.css'] as any);
      vi.mocked(fs.stat).mockResolvedValue({ size: 100000, isFile: () => true } as any);
      vi.mocked(fs.readFile).mockImplementation(async (filePath: any) => {
        if (typeof filePath === 'string' && filePath.includes('spec.json')) {
          return JSON.stringify({ feature_name: 'critical-serena-refactoring' });
        } else if (typeof filePath === 'string' && filePath.includes('.log')) {
          return 'SQL log content';
        } else {
          // Return buffer for other files
          return Buffer.alloc(100000, 'a');
        }
      });
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      // Act - This would be the main entry point
      const { collectAndSaveMetrics } = await import('../collect-metrics');
      const result = await collectAndSaveMetrics({
        actuatorUrl: 'http://localhost:8080',
        bundlePath: './frontend/dist',
        logPath: './logs/teamdev.log',
        outputPath: './baseline-metrics.json',
        specPath: './spec.json'
      });

      // Assert
      expect(result).toBe(true);
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });
});