import MockAdapter from "axios-mock-adapter";
import Cookies from "js-cookie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, createApiClient } from "../axiosClient";
import { ApiError } from "../errors/ApiError";
import { authEvents } from "../events/authEvents";

// Create a mock adapter for testing
let mock: MockAdapter;

describe("API Client Integration Tests", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Create a new instance for testing
    const client = createApiClient();
    mock = new MockAdapter(client);
  });

  afterEach(() => {
    // Restore the mock adapter
    mock.restore();
  });

  describe("Full flow integration", () => {
    it("should make successful GET request with CSRF token", async () => {
      // Setup CSRF token
      const csrfToken = "test-csrf-token";
      (vi.spyOn(Cookies, "get") as ReturnType<typeof vi.fn>).mockReturnValue(
        csrfToken
      );

      // Create client and mock
      const client = createApiClient();
      const mockInstance = new MockAdapter(client);

      // Mock successful response
      const responseData = { id: 1, name: "Test User" };
      mockInstance.onGet("/api/users/1").reply(200, responseData);

      // Make request
      const response = await client.get("/api/users/1");

      // Verify response
      expect(response.data).toEqual(responseData);
      expect(response.status).toBe(200);

      // Verify CSRF token was added
      const request = mockInstance.history.get[0];
      expect(request).toBeDefined();
      const requestHeaders = request?.headers;
      expect(requestHeaders?.["X-XSRF-TOKEN"]).toBe(csrfToken);

      mockInstance.restore();
    });

    it("should handle 401 error and emit unauthorized event", async () => {
      // Create client and mock
      const client = createApiClient();
      const mockInstance = new MockAdapter(client);

      // Spy on authEvents
      const emitSpy = vi.spyOn(authEvents, "emitUnauthorized");

      // Mock 401 response
      mockInstance.onGet("/api/protected").reply(401, {
        message: "Authentication required",
        code: "UNAUTHORIZED",
      });

      // Make request and expect error
      await expect(client.get("/api/protected")).rejects.toThrow(ApiError);

      try {
        await client.get("/api/protected");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(401);
        expect(apiError.message).toBe("Authentication required");
        expect(apiError.code).toBe("UNAUTHORIZED");
      }

      // Verify unauthorized event was emitted
      expect(emitSpy).toHaveBeenCalledWith("Authentication required");

      mockInstance.restore();
    });

    it("should handle network errors gracefully", async () => {
      // Create client and mock
      const client = createApiClient();
      const mockInstance = new MockAdapter(client);

      // Mock network error
      mockInstance.onGet("/api/test").networkError();

      // Make request and expect error
      await expect(client.get("/api/test")).rejects.toThrow(ApiError);

      try {
        await client.get("/api/test");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(0);
        // axios-mock-adapter produces "Network Error" message
        expect(apiError.message).toBe("Network Error");
        expect(apiError.code).toBe("NETWORK_ERROR");
      }

      mockInstance.restore();
    });

    it("should handle timeout errors", async () => {
      // Create client and mock
      const client = createApiClient();
      const mockInstance = new MockAdapter(client);

      // Mock timeout
      mockInstance.onGet("/api/slow").timeout();

      // Make request and expect error
      await expect(client.get("/api/slow")).rejects.toThrow(ApiError);

      try {
        await client.get("/api/slow");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        const apiError = error as ApiError;
        expect(apiError.status).toBe(0);
        expect(apiError.code).toBe("TIMEOUT");
      }

      mockInstance.restore();
    });
  });

  describe("Convenience API methods", () => {
    it("should return data directly from GET request", async () => {
      // Import the actual apiClient to mock it
      const { apiClient } = await import("../axiosClient");
      const mockInstance = new MockAdapter(apiClient);

      const responseData = { id: 1, name: "Test" };
      mockInstance.onGet("/test").reply(200, responseData);

      const data = await api.get("/test");
      expect(data).toEqual(responseData);

      mockInstance.restore();
    });

    it("should return data directly from POST request", async () => {
      // Import the actual apiClient to mock it
      const { apiClient } = await import("../axiosClient");
      const mockInstance = new MockAdapter(apiClient);

      const requestData = { name: "New User" };
      const responseData = { id: 1, ...requestData };
      mockInstance.onPost("/users", requestData).reply(201, responseData);

      const data = await api.post("/users", requestData);
      expect(data).toEqual(responseData);

      mockInstance.restore();
    });
  });

  describe("Configuration options", () => {
    it("should skip CSRF token when configured", async () => {
      // Create client with skipCsrfToken option
      const client = createApiClient({ skipCsrfToken: true });
      const mockInstance = new MockAdapter(client);

      // Mock CSRF token
      const csrfToken = "test-csrf-token";
      (vi.spyOn(Cookies, "get") as ReturnType<typeof vi.fn>).mockReturnValue(
        csrfToken
      );

      // Mock response
      mockInstance.onGet("/api/test").reply(200, {});

      // Make request
      await client.get("/api/test");

      // Verify CSRF token was NOT added
      const request = mockInstance.history.get[0];
      expect(request).toBeDefined();
      const requestHeaders = request?.headers;
      expect(requestHeaders?.["X-XSRF-TOKEN"]).toBeUndefined();

      mockInstance.restore();
    });

    it("should skip error interceptor when configured", async () => {
      // Create client with skipErrorInterceptor option
      const client = createApiClient({ skipErrorInterceptor: true });
      const mockInstance = new MockAdapter(client);

      // Spy on authEvents
      const emitSpy = vi.spyOn(authEvents, "emitUnauthorized");

      // Mock 401 response
      mockInstance.onGet("/api/protected").reply(401, {
        message: "Unauthorized",
      });

      // Make request - should throw axios error, not ApiError
      try {
        await client.get("/api/protected");
      } catch (error) {
        // Should be an axios error, not ApiError
        expect(error).not.toBeInstanceOf(ApiError);
      }

      // Verify unauthorized event was NOT emitted
      expect(emitSpy).not.toHaveBeenCalled();

      mockInstance.restore();
    });
  });
});
