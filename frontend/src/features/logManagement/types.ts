export type LogLevel =
  | "TRACE"
  | "DEBUG"
  | "INFO"
  | "WARN"
  | "ERROR"
  | "FATAL";

export type LogActor = {
  id: number;
  name: string;
};

export type LogEntry = {
  id: number;
  timestamp: string;
  level: LogLevel;
  operationType: string;
  actor: LogActor;
  message: string;
  metadata?: Record<string, unknown>;
};

export type LogSearchResponse = {
  items: LogEntry[];
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type DateRange = {
  from?: string;
  to?: string;
};

export type LogSearchFilters = {
  keyword?: string;
  levels?: LogLevel[];
  employeeIds?: number[];
  operationTypes?: string[];
  dateRange?: DateRange;
  hasErrors?: boolean;
  ipAddresses?: string[];
  page?: number;
  pageSize?: number;
  sort?: "timestamp:asc" | "timestamp:desc";
};

export type LogExportFormat = "csv" | "json";

export type LogExportFilters = LogSearchFilters & {
  format?: LogExportFormat;
};
