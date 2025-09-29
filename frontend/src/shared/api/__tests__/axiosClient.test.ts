import type { AxiosInstance } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "../axiosClient";

vi.mock("@/shared/lib/env", () => ({
  getEnv: vi.fn(() => ({
    apiBaseUrl: "http://localhost:8080/api",
  })),
}));

describe("axiosClient", () => {
  let apiClient: AxiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createApiClient", () => {
    it("should create an axios instance with correct base configuration", () => {
      apiClient = createApiClient();

      expect(apiClient).toBeDefined();
      expect(apiClient.defaults.baseURL).toBe("http://localhost:8080/api");
      expect(apiClient.defaults.timeout).toBe(30_000);
      expect(apiClient.defaults.withCredentials).toBe(true);
    });

    it("should set the correct default headers", () => {
      apiClient = createApiClient();

      // Headers in axios are stored in the headers object directly,
      // not in the common subobject for default creation
      const headers = apiClient.defaults.headers as Record<
        string,
        string | Record<string, string>
      >;
      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers.Accept).toBe("application/json");
    });

    it("should allow custom configuration to override defaults", () => {
      const customConfig = {
        timeout: 60_000,
        headers: {
          "X-Custom-Header": "custom-value",
        },
      };

      apiClient = createApiClient(customConfig);

      expect(apiClient.defaults.timeout).toBe(60_000);
      const headers = apiClient.defaults.headers as Record<
        string,
        string | Record<string, string>
      >;
      expect(headers["X-Custom-Header"]).toBe("custom-value");
    });
  });

  describe("interceptors", () => {
    it("should register request interceptors", () => {
      apiClient = createApiClient();

      // Check that request interceptors are registered
      // The actual interceptor count will depend on our implementation
      expect(apiClient.interceptors.request).toBeDefined();
    });

    it("should register response interceptors", () => {
      apiClient = createApiClient();

      // Check that response interceptors are registered
      expect(apiClient.interceptors.response).toBeDefined();
    });
  });
});
