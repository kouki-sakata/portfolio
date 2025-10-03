import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api/axiosClient", () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock("@/shared/lib/env", () => ({
  getEnv: () => ({ apiBaseUrl: "https://example.com/api" }),
}));

import type {
  LogSearchFilters,
  LogSearchResponse,
} from "@/features/logManagement/types";
import { api } from "@/shared/api/axiosClient";
import { ApiError } from "@/shared/api/errors/ApiError";

import { exportLogs, searchLogs, streamLogExport } from "./logApi";

const mockedApi = vi.mocked(api);
const originalFetch = globalThis.fetch;

describe("logApi", () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    globalThis.fetch = originalFetch;
  });

  it("searches logs with advanced filters", async () => {
    const filters: LogSearchFilters = {
      keyword: "failed",
      levels: ["ERROR", "WARN"],
      employeeIds: [1, 2],
      operationTypes: ["LOGIN", "EXPORT"],
      dateRange: { from: "2025-01-01T00:00:00Z", to: "2025-01-31T23:59:59Z" },
      hasErrors: true,
      ipAddresses: ["192.168.0.1"],
      page: 3,
      pageSize: 100,
      sort: "timestamp:desc",
    };

    const response: LogSearchResponse = {
      items: [
        {
          id: 1,
          timestamp: "2025-01-15T10:00:00Z",
          level: "ERROR",
          operationType: "LOGIN",
          actor: { id: 1, name: "Admin" },
          message: "Login failed",
          metadata: { ipAddress: "192.168.0.1" },
        },
      ],
      page: 3,
      pageSize: 100,
      total: 250,
      hasNext: true,
      hasPrevious: true,
    };

    mockedApi.get.mockResolvedValue(response);

    const result = await searchLogs(filters);

    expect(mockedApi.get).toHaveBeenCalledWith("/api/logs", {
      params: {
        keyword: "failed",
        levels: "ERROR,WARN",
        employeeIds: "1,2",
        operations: "LOGIN,EXPORT",
        from: "2025-01-01T00:00:00Z",
        to: "2025-01-31T23:59:59Z",
        hasErrors: true,
        ipAddresses: "192.168.0.1",
        page: 3,
        size: 100,
        sort: "timestamp:desc",
      },
    });
    expect(result).toStrictEqual(response);
  });

  it("exports logs as blob", async () => {
    const blob = new Blob(["id,timestamp,level\n"], { type: "text/csv" });
    mockedApi.get.mockResolvedValue(blob);

    const result = await exportLogs({ format: "csv", keyword: "audit" });

    expect(mockedApi.get).toHaveBeenCalledWith("/api/logs/export", {
      params: {
        format: "csv",
        keyword: "audit",
      },
      responseType: "blob",
    });
    expect(result).toBe(blob);
  });

  it("streams log export with fetch", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("log data"));
        controller.close();
      },
    });

    const response = new Response(stream, {
      status: 200,
      headers: { "Content-Type": "text/csv" },
    });

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(response as unknown as Response);

    const result = await streamLogExport({
      format: "csv",
      keyword: "error",
      levels: ["ERROR"],
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://example.com/api/logs/export?keyword=error&levels=ERROR&format=csv",
      {
        credentials: "include",
        headers: {
          accept: "text/csv",
        },
        method: "GET",
      }
    );
    expect(result).toBe(response.body);
  });

  it("throws ApiError when streaming fails", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response("", { status: 500, statusText: "Server Error" })
      );

    await expect(streamLogExport()).rejects.toBeInstanceOf(ApiError);
    expect(fetchSpy).toHaveBeenCalled();
  });
});
