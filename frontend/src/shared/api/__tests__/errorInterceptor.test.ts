import type { AxiosError, AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../errors/ApiError";
import { authEvents } from "../events/authEvents";
import { createErrorInterceptor } from "../interceptors/errorInterceptor";

// Mock authEvents
vi.mock("../events/authEvents", () => ({
  authEvents: {
    emitUnauthorized: vi.fn(),
  },
}));

describe("errorInterceptor", () => {
  let errorInterceptor: ReturnType<typeof createErrorInterceptor>;

  beforeEach(() => {
    vi.clearAllMocks();
    errorInterceptor = createErrorInterceptor();
  });

  describe("response interceptor", () => {
    it("should pass through successful responses", () => {
      const mockResponse: AxiosResponse = {
        data: { message: "success" },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as never,
      };

      const result = errorInterceptor.response(mockResponse);
      expect(result).toBe(mockResponse);
    });

    it("should transform 401 errors to ApiError and emit unauthorized event", async () => {
      const mockError: AxiosError = {
        response: {
          data: { message: "Unauthorized access" },
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config: {} as never,
        },
        config: {} as never,
        isAxiosError: true,
        toJSON: () => ({}),
        name: "AxiosError",
        message: "Request failed with status code 401",
      };

      await expect(errorInterceptor.responseError(mockError)).rejects.toThrow(
        ApiError
      );

      try {
        await errorInterceptor.responseError(mockError);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(401);
        expect((error as ApiError).message).toBe("Unauthorized access");
        expect(authEvents.emitUnauthorized).toHaveBeenCalled();
      }
    });

    it("should transform 400 errors to ApiError", async () => {
      const mockError: AxiosError = {
        response: {
          data: { message: "Bad request", code: "VALIDATION_ERROR" },
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config: {} as never,
        },
        config: {} as never,
        isAxiosError: true,
        toJSON: () => ({}),
        name: "AxiosError",
        message: "Request failed with status code 400",
      };

      await expect(errorInterceptor.responseError(mockError)).rejects.toThrow(
        ApiError
      );

      try {
        await errorInterceptor.responseError(mockError);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).message).toBe("Bad request");
        expect((error as ApiError).code).toBe("VALIDATION_ERROR");
        expect(authEvents.emitUnauthorized).not.toHaveBeenCalled();
      }
    });

    it("should handle network errors", async () => {
      const mockError: AxiosError = {
        request: {},
        config: {} as never,
        isAxiosError: true,
        toJSON: () => ({}),
        name: "AxiosError",
        message: "Network Error",
      };

      await expect(errorInterceptor.responseError(mockError)).rejects.toThrow(
        ApiError
      );

      try {
        await errorInterceptor.responseError(mockError);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(0);
        expect((error as ApiError).message).toBe("Network Error");
        expect((error as ApiError).code).toBe("NETWORK_ERROR");
      }
    });

    it("should handle timeout errors", async () => {
      const mockError: AxiosError = {
        code: "ECONNABORTED",
        config: {} as never,
        isAxiosError: true,
        toJSON: () => ({}),
        name: "AxiosError",
        message: "timeout of 30000ms exceeded",
      };

      await expect(errorInterceptor.responseError(mockError)).rejects.toThrow(
        ApiError
      );

      try {
        await errorInterceptor.responseError(mockError);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(0);
        expect((error as ApiError).message).toBe("Request timeout");
        expect((error as ApiError).code).toBe("TIMEOUT");
      }
    });

    it("should handle errors without response data", async () => {
      const mockError: AxiosError = {
        response: {
          data: null,
          status: 500,
          statusText: "Internal Server Error",
          headers: {},
          config: {} as never,
        },
        config: {} as never,
        isAxiosError: true,
        toJSON: () => ({}),
        name: "AxiosError",
        message: "Request failed with status code 500",
      };

      await expect(errorInterceptor.responseError(mockError)).rejects.toThrow(
        ApiError
      );

      try {
        await errorInterceptor.responseError(mockError);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(500);
        expect((error as ApiError).message).toBe("Internal Server Error");
      }
    });

    it("should re-throw non-axios errors", async () => {
      const mockError = new Error("Some other error");

      await expect(errorInterceptor.responseError(mockError)).rejects.toThrow(
        "Some other error"
      );
      expect(authEvents.emitUnauthorized).not.toHaveBeenCalled();
    });
  });

  describe("configuration options", () => {
    it("should not emit unauthorized event when skipUnauthorizedEvent is true", async () => {
      const customInterceptor = createErrorInterceptor({
        skipUnauthorizedEvent: true,
      });

      const mockError: AxiosError = {
        response: {
          data: { message: "Unauthorized" },
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config: {} as never,
        },
        config: {} as never,
        isAxiosError: true,
        toJSON: () => ({}),
        name: "AxiosError",
        message: "Request failed with status code 401",
      };

      await expect(customInterceptor.responseError(mockError)).rejects.toThrow(
        ApiError
      );
      expect(authEvents.emitUnauthorized).not.toHaveBeenCalled();
    });

    it("should allow custom error message extractor", async () => {
      const customInterceptor = createErrorInterceptor({
        extractMessage: (data) => data?.error || "Unknown error",
      });

      const mockError: AxiosError = {
        response: {
          data: { error: "Custom error message" },
          status: 400,
          statusText: "Bad Request",
          headers: {},
          config: {} as never,
        },
        config: {} as never,
        isAxiosError: true,
        toJSON: () => ({}),
        name: "AxiosError",
        message: "Request failed with status code 400",
      };

      try {
        await customInterceptor.responseError(mockError);
      } catch (error) {
        expect((error as ApiError).message).toBe("Custom error message");
      }
    });
  });
});

describe("ApiError", () => {
  it("should create an ApiError instance", () => {
    const error = new ApiError("Test error", 400, "TEST_ERROR", {
      field: "value",
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.name).toBe("ApiError");
    expect(error.message).toBe("Test error");
    expect(error.status).toBe(400);
    expect(error.code).toBe("TEST_ERROR");
    expect(error.details).toEqual({ field: "value" });
  });

  it("should work with instanceof checks", () => {
    const error = new ApiError("Test error", 500);

    expect(error instanceof Error).toBe(true);
    expect(error instanceof ApiError).toBe(true);
  });
});
