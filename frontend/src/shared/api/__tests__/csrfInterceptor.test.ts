import type { InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import Cookies from "js-cookie";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetCsrfTokenForTests,
  createCsrfInterceptor,
} from "../interceptors/csrfInterceptor";

vi.mock("axios", () => {
  const axiosMock = vi.fn();
  axiosMock.get = vi.fn();
  axiosMock.request = vi.fn();
  return {
    __esModule: true,
    default: axiosMock,
  };
});

// Mock js-cookie
vi.mock("js-cookie", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("csrfInterceptor", () => {
  let mockConfig: InternalAxiosRequestConfig;
  let csrfInterceptor: ReturnType<typeof createCsrfInterceptor>;
  const mockedAxios = vi.mocked(axios, true);
  type ResponseErrorHandler = NonNullable<
    ReturnType<typeof createCsrfInterceptor>["responseError"]
  >;

  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.get.mockReset();
    mockedAxios.request.mockReset();
    __resetCsrfTokenForTests();
    mockConfig = {
      headers: {},
      url: "/api/test",
      method: "POST",
    } as InternalAxiosRequestConfig;

    csrfInterceptor = createCsrfInterceptor();
  });

  afterEach(() => {
    vi.clearAllMocks();
    __resetCsrfTokenForTests();
  });

  describe("request interceptor", () => {
    it("should add CSRF token to headers when token exists in cookie", () => {
      const mockToken = "test-csrf-token-123";
      (vi.mocked(Cookies.get) as ReturnType<typeof vi.fn>).mockReturnValue(
        mockToken
      );

      const result = csrfInterceptor.request(mockConfig);

      expect(Cookies.get).toHaveBeenCalledWith("XSRF-TOKEN");
      expect(result.headers["X-XSRF-TOKEN"]).toBe(mockToken);
    });

    it("should not add CSRF token header when token does not exist in cookie", () => {
      (vi.mocked(Cookies.get) as ReturnType<typeof vi.fn>).mockReturnValue(
        undefined
      );

      const result = csrfInterceptor.request(mockConfig);

      expect(Cookies.get).toHaveBeenCalledWith("XSRF-TOKEN");
      expect(result.headers["X-XSRF-TOKEN"]).toBeUndefined();
    });

    it("should not override existing X-XSRF-TOKEN header", () => {
      const existingToken = "existing-token";
      const cookieToken = "cookie-token";

      mockConfig.headers["X-XSRF-TOKEN"] = existingToken;
      (vi.mocked(Cookies.get) as ReturnType<typeof vi.fn>).mockReturnValue(
        cookieToken
      );

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
      (vi.mocked(Cookies.get) as ReturnType<typeof vi.fn>).mockReturnValue(
        mockToken
      );

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
      (vi.mocked(Cookies.get) as ReturnType<typeof vi.fn>).mockReturnValue(
        mockToken
      );

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
      (vi.mocked(Cookies.get) as ReturnType<typeof vi.fn>).mockReturnValue(
        mockToken
      );

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
      (vi.mocked(Cookies.get) as ReturnType<typeof vi.fn>).mockReturnValue(
        mockToken
      );

      const result = interceptor.request(postConfig);

      expect(Cookies.get).toHaveBeenCalled();
      expect(result.headers["X-XSRF-TOKEN"]).toBe(mockToken);
    });
  });

  describe("response interceptor (error handling)", () => {
    it("should refresh CSRF token and retry request on 403 CSRF error", async () => {
      const retryResponse = { data: "ok" };

      mockedAxios.get.mockResolvedValue({
        headers: {
          "x-xsrf-token": "refreshed-token",
        },
      } as never);
      mockedAxios.request.mockResolvedValue(retryResponse as never);

      const error = {
        config: {
          headers: {},
          method: "POST",
          baseURL: "/api",
          url: "/api/home/stamps",
        } as InternalAxiosRequestConfig,
        response: {
          status: 403,
          data: { message: "Invalid CSRF Token" },
          headers: {},
        },
      } as unknown as Parameters<ResponseErrorHandler>[0];

      const result = await csrfInterceptor.responseError?.(error);

      expect(mockedAxios.get).toHaveBeenCalledWith("/api/auth/session", {
        withCredentials: true,
      });
      expect(mockedAxios.request).toHaveBeenCalledWith(error.config);
      expect(result).toBe(retryResponse);

      (vi.mocked(Cookies.get) as ReturnType<typeof vi.fn>).mockReturnValue(
        undefined
      );
      const followUpConfig = csrfInterceptor.request({
        headers: {},
        method: "POST",
      } as InternalAxiosRequestConfig);

      expect(followUpConfig.headers["X-XSRF-TOKEN"]).toBe("refreshed-token");
    });

    it("should not retry when 403 is unrelated to CSRF", async () => {
      const error = {
        config: mockConfig,
        response: {
          status: 403,
          data: { message: "Forbidden" },
          headers: {},
        },
      } as unknown as Parameters<ResponseErrorHandler>[0];

      await expect(csrfInterceptor.responseError?.(error)).rejects.toBe(error);

      expect(mockedAxios.get).not.toHaveBeenCalled();
      expect(mockedAxios.request).not.toHaveBeenCalled();
    });

    it("should not retry more than once", async () => {
      const error = {
        config: {
          ...mockConfig,
          headers: {},
        },
        response: {
          status: 403,
          data: { message: "Invalid CSRF Token" },
          headers: {},
        },
      } as unknown as Parameters<ResponseErrorHandler>[0];

      mockedAxios.get.mockRejectedValue(new Error("refresh failed"));

      await expect(csrfInterceptor.responseError?.(error)).rejects.toBe(error);

      expect(mockedAxios.request).not.toHaveBeenCalled();
    });
  });
});
