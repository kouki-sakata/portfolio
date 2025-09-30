import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  AuthenticationError,
  NetworkError,
  ValidationError,
} from "@/shared/api/errors";
import { GlobalErrorHandler } from "@/shared/error-handling";
import {
  clearQueryCache,
  createEnhancedQueryClient,
  retryFailedQueries,
} from "./enhanced-query-client";

describe("Enhanced Query Client", () => {
  const mockToast = vi.fn();
  const mockOnLogout = vi.fn().mockResolvedValue(undefined);
  const mockOnRedirect = vi.fn();
  const _mockOnRetry = vi.fn();

  beforeEach(() => {
    GlobalErrorHandler.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    GlobalErrorHandler.reset();
  });

  describe("createEnhancedQueryClient", () => {
    it("should create a QueryClient with proper configuration", () => {
      const queryClient = createEnhancedQueryClient({
        toast: mockToast,
        onLogout: mockOnLogout,
        onRedirect: mockOnRedirect,
        environment: "development",
      });

      expect(queryClient).toBeInstanceOf(QueryClient);
      expect(
        queryClient.getDefaultOptions().queries?.refetchOnWindowFocus
      ).toBe(false);
      expect(queryClient.getDefaultOptions().queries?.refetchOnReconnect).toBe(
        true
      );
    });

    it("should initialize GlobalErrorHandler", () => {
      createEnhancedQueryClient({
        toast: mockToast,
        environment: "development",
      });

      const errorHandler = GlobalErrorHandler.getInstance();
      expect(errorHandler).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = createEnhancedQueryClient({
        toast: mockToast,
        onLogout: mockOnLogout,
        onRedirect: mockOnRedirect,
        environment: "development",
      });
    });

    it("should handle NetworkError with toast notification", () => {
      const error = new NetworkError(
        "Network failed",
        new Error("Connection lost")
      );
      const queryCache = queryClient.getQueryCache();

      // Trigger error handler through QueryCache
      queryCache.config.onError?.(error, {
        queryKey: ["test"],
        queryHash: "test",
        state: {} as any,
      } as any);

      // GlobalErrorHandlerがtoastを呼び出すことを確認
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "ネットワークエラー",
          variant: "destructive",
        })
      );
    });

    it("should handle AuthenticationError with logout and redirect", async () => {
      const error = new AuthenticationError("Unauthorized");
      const queryCache = queryClient.getQueryCache();

      // Trigger error handler
      queryCache.config.onError?.(error, {
        queryKey: ["test"],
        queryHash: "test",
        state: {} as any,
      } as any);

      // Wait for async logout
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockOnLogout).toHaveBeenCalled();
      expect(mockOnRedirect).toHaveBeenCalledWith("/auth/signin");
      // 認証エラーではToastを表示しない
      expect(mockToast).not.toHaveBeenCalled();
    });

    it("should handle ValidationError with toast", () => {
      const error = new ValidationError("Validation failed", 422, {
        email: ["Invalid email format"],
      });
      const queryCache = queryClient.getQueryCache();

      queryCache.config.onError?.(error, {
        queryKey: ["test"],
        queryHash: "test",
        state: {} as any,
      } as any);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "入力エラー",
          variant: "destructive",
        })
      );
    });

    it("should handle mutation errors", () => {
      const error = new ApiError("Bad request", 400);
      const mutationCache = queryClient.getMutationCache();

      mutationCache.config.onError?.(error, {}, {}, {} as any);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "エラー",
          variant: "destructive",
        })
      );
    });
  });

  describe("Retry Logic", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = createEnhancedQueryClient({
        toast: mockToast,
        environment: "development",
      });
    });

    it("should retry on NetworkError", () => {
      const error = new NetworkError(
        "Network failed",
        new Error("Connection lost")
      );
      const retryFn = queryClient.getDefaultOptions().queries?.retry;

      if (typeof retryFn === "function") {
        expect(retryFn(0, error)).toBe(true); // First retry
        expect(retryFn(1, error)).toBe(true); // Second retry
        expect(retryFn(2, error)).toBe(true); // Third retry
        expect(retryFn(3, error)).toBe(false); // No more retries
      }
    });

    it("should not retry on AuthenticationError", () => {
      const error = new AuthenticationError("Unauthorized");
      const retryFn = queryClient.getDefaultOptions().queries?.retry;

      if (typeof retryFn === "function") {
        expect(retryFn(0, error)).toBe(false);
      }
    });

    it("should retry on 500 server errors", () => {
      const error = new ApiError("Server error", 500);
      const retryFn = queryClient.getDefaultOptions().queries?.retry;

      if (typeof retryFn === "function") {
        expect(retryFn(0, error)).toBe(true);
        expect(retryFn(1, error)).toBe(true);
        expect(retryFn(2, error)).toBe(true);
        expect(retryFn(3, error)).toBe(false);
      }
    });

    it("should not retry on 400 client errors", () => {
      const error = new ApiError("Bad request", 400);
      const retryFn = queryClient.getDefaultOptions().queries?.retry;

      if (typeof retryFn === "function") {
        expect(retryFn(0, error)).toBe(false);
      }
    });

    it("should have exponential backoff for retry delay", () => {
      const retryDelay = queryClient.getDefaultOptions().queries?.retryDelay;

      if (typeof retryDelay === "function") {
        expect(retryDelay(0)).toBe(1000); // 1 second
        expect(retryDelay(1)).toBe(2000); // 2 seconds
        expect(retryDelay(2)).toBe(4000); // 4 seconds
        expect(retryDelay(3)).toBe(8000); // 8 seconds
        expect(retryDelay(10)).toBe(30_000); // Max 30 seconds
      }
    });
  });

  describe("Mutation Retry Logic", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = createEnhancedQueryClient({
        toast: mockToast,
        environment: "development",
      });
    });

    it("should retry mutation once on NetworkError", () => {
      const error = new NetworkError(
        "Network failed",
        new Error("Connection lost")
      );
      const retryFn = queryClient.getDefaultOptions().mutations?.retry;

      if (typeof retryFn === "function") {
        expect(retryFn(0, error)).toBe(true); // First retry
        expect(retryFn(1, error)).toBe(false); // No more retries
      }
    });

    it("should not retry mutation on other errors", () => {
      const error = new ApiError("Bad request", 400);
      const retryFn = queryClient.getDefaultOptions().mutations?.retry;

      if (typeof retryFn === "function") {
        expect(retryFn(0, error)).toBe(false);
      }
    });
  });

  describe("Utility Functions", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
      queryClient = createEnhancedQueryClient({
        toast: mockToast,
        environment: "development",
      });
    });

    it("should clear specific query cache", () => {
      const spy = vi.spyOn(queryClient, "invalidateQueries");

      clearQueryCache(queryClient, ["users"]);

      expect(spy).toHaveBeenCalledWith({ queryKey: ["users"] });
    });

    it("should clear all query cache when no key provided", () => {
      const spy = vi.spyOn(queryClient, "clear");

      clearQueryCache(queryClient);

      expect(spy).toHaveBeenCalled();
    });

    it("should retry failed queries", async () => {
      const spy = vi.spyOn(queryClient, "refetchQueries");

      await retryFailedQueries(queryClient);

      expect(spy).toHaveBeenCalledWith({
        predicate: expect.any(Function),
      });
    });
  });
});
