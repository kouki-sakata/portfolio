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
 * Collect API response time metrics from Spring Boot Actuator
 */
export declare function collectActuatorMetrics(baseUrl: string): Promise<ApiMetrics>;
/**
 * Collect frontend bundle size metrics
 */
export declare function collectBundleMetrics(distPath: string): Promise<BundleMetrics>;
/**
 * Parse MyBatis SQL logs and extract query performance metrics
 */
export declare function collectDatabaseMetrics(logPath: string): Promise<DatabaseMetrics>;
/**
 * Generate baseline metrics and save to file
 */
export declare function generateBaselineMetrics(apiMetrics: ApiMetrics, bundleMetrics: BundleMetrics, dbMetrics: DatabaseMetrics, outputPath: string, specPath?: string): Promise<BaselineMetrics>;
/**
 * Main function to collect all metrics and save results
 */
export declare function collectAndSaveMetrics(options: CollectMetricsOptions): Promise<boolean>;
export {};
//# sourceMappingURL=collect-metrics.d.ts.map