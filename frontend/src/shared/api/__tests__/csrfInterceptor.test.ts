import type { InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createCsrfInterceptor } from "../interceptors/csrfInterceptor";

// Mock js-cookie
vi.mock("js-cookie", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("csrfInterceptor", () => {
  let mockConfig: InternalAxiosRequestConfig;
  let csrfInterceptor: ReturnType<typeof createCsrfInterceptor>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig = {
      headers: {},
      url: "/api/test",
      method: "POST",
    } as InternalAxiosRequestConfig;

    csrfInterceptor = createCsrfInterceptor();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("request interceptor", () => {
    it("should add CSRF token to headers when token exists in cookie", () => {
      const mockToken = "test-csrf-token-123";
      vi.mocked(Cookies.get).mockReturnValue(mockToken);

      const result = csrfInterceptor.request(mockConfig);

      expect(Cookies.get).toHaveBeenCalledWith("XSRF-TOKEN");
      expect(result.headers["X-XSRF-TOKEN"]).toBe(mockToken);
    });

    it("should not add CSRF token header when token does not exist in cookie", () => {
      vi.mocked(Cookies.get).mockReturnValue(undefined);

      const result = csrfInterceptor.request(mockConfig);

      expect(Cookies.get).toHaveBeenCalledWith("XSRF-TOKEN");
      expect(result.headers["X-XSRF-TOKEN"]).toBeUndefined();
    });

    it("should not override existing X-XSRF-TOKEN header", () => {
      const existingToken = "existing-token";
      const cookieToken = "cookie-token";

      mockConfig.headers["X-XSRF-TOKEN"] = existingToken;
      vi.mocked(Cookies.get).mockReturnValue(cookieToken);

      const result = csrfInterceptor.request(mockConfig);

      expect(result.headers["X-XSRF-TOKEN"]).toBe(existingToken);
    });

    it("should handle request error correctly", () => {
      const mockError = new Error("Request error");

      expect(() => csrfInterceptor.requestError(mockError)).toThrow(mockError);
    });
  });

  describe("configuration options", () => {
    it("should allow custom cookie name", () => {
      const customCookieName = "MY-CSRF-TOKEN";
      const customInterceptor = createCsrfInterceptor({
        cookieName: customCookieName,
      });

      const mockToken = "custom-token";
      vi.mocked(Cookies.get).mockReturnValue(mockToken);

      const result = customInterceptor.request(mockConfig);

      expect(Cookies.get).toHaveBeenCalledWith(customCookieName);
      expect(result.headers["X-XSRF-TOKEN"]).toBe(mockToken);
    });

    it("should allow custom header name", () => {
      const customHeaderName = "X-CUSTOM-CSRF";
      const customInterceptor = createCsrfInterceptor({
        headerName: customHeaderName,
      });

      const mockToken = "custom-token";
      vi.mocked(Cookies.get).mockReturnValue(mockToken);

      const result = customInterceptor.request(mockConfig);

      expect(result.headers[customHeaderName]).toBe(mockToken);
      expect(result.headers["X-XSRF-TOKEN"]).toBeUndefined();
    });

    it("should skip CSRF token for GET requests when skipGET is true", () => {
      const interceptor = createCsrfInterceptor({
        skipGET: true,
      });

      const getConfig = {
        ...mockConfig,
        method: "GET",
      } as InternalAxiosRequestConfig;

      const mockToken = "test-token";
      vi.mocked(Cookies.get).mockReturnValue(mockToken);

      const result = interceptor.request(getConfig);

      expect(Cookies.get).not.toHaveBeenCalled();
      expect(result.headers["X-XSRF-TOKEN"]).toBeUndefined();
    });

    it("should add CSRF token for non-GET requests when skipGET is true", () => {
      const interceptor = createCsrfInterceptor({
        skipGET: true,
      });

      const postConfig = {
        ...mockConfig,
        method: "POST",
      } as InternalAxiosRequestConfig;

      const mockToken = "test-token";
      vi.mocked(Cookies.get).mockReturnValue(mockToken);

      const result = interceptor.request(postConfig);

      expect(Cookies.get).toHaveBeenCalled();
      expect(result.headers["X-XSRF-TOKEN"]).toBe(mockToken);
    });
  });
});
