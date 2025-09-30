import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  AuthenticationError,
  NetworkError,
  ValidationError,
} from "../api/errors";
import { GlobalErrorHandler } from "./GlobalErrorHandler";

describe("GlobalErrorHandler", () => {
  const mockToast = vi.fn();
  const mockLogger = {
    log: vi.fn(),
    sendToRemote: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    // GlobalErrorHandlerをリセット
    GlobalErrorHandler.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    GlobalErrorHandler.reset();
  });

  describe("Singleton Pattern", () => {
    it("should return the same instance", () => {
      const instance1 = GlobalErrorHandler.initialize({
        toast: mockToast,
        logger: mockLogger,
        environment: "development",
      });

      const instance2 = GlobalErrorHandler.getInstance();

      expect(instance1).toBe(instance2);
    });

    it("should throw error when getInstance is called before initialize", () => {
      expect(() => GlobalErrorHandler.getInstance()).toThrow(
        "GlobalErrorHandler not initialized"
      );
    });
  });

  describe("Error Handling", () => {
    let handler: GlobalErrorHandler;

    beforeEach(() => {
      handler = GlobalErrorHandler.initialize({
        toast: mockToast,
        logger: mockLogger,
        environment: "development",
      });
    });

    it("should display toast for ApiError", () => {
      const error = new ApiError("Test error", 400);
      handler.handle(error);

      expect(mockToast).toHaveBeenCalledWith({
        title: "エラー",
        description: "Test error", // ApiError は message をそのまま返す
        variant: "destructive",
        duration: 5000,
      });
      expect(mockLogger.log).toHaveBeenCalledWith(error, "error");
    });

    it("should display toast for NetworkError with retry action", () => {
      const mockOnRetry = vi.fn();
      // Reset before creating new instance with different config
      GlobalErrorHandler.reset();
      vi.clearAllMocks();
      const handlerWithRetry = GlobalErrorHandler.initialize({
        toast: mockToast,
        logger: mockLogger,
        environment: "development",
        onRetry: mockOnRetry,
      });

      const error = new NetworkError(
        "Network failed",
        new Error("Original error")
      );
      handlerWithRetry.handle(error);

      const toastCall = mockToast.mock.calls[0]?.[0];
      expect(toastCall).toBeDefined();
      expect(toastCall?.title).toBe("ネットワークエラー");
      expect(toastCall?.description).toBe(
        "ネットワークエラーが発生しました。接続を確認してください。"
      );
      expect(toastCall?.variant).toBe("destructive");
      expect(toastCall?.duration).toBe(5000);
      expect(toastCall?.action).toBeDefined();
      expect(toastCall?.action?.label).toBe("再試行");
      expect(toastCall?.action?.onClick).toBe(mockOnRetry);
      expect(mockLogger.log).toHaveBeenCalledWith(error, "error");
    });

    it("should display toast for ValidationError", () => {
      const error = new ValidationError("Validation failed", 422, {
        email: ["メールアドレスが無効です"],
      });
      handler.handle(error);

      expect(mockToast).toHaveBeenCalledWith({
        title: "入力エラー",
        description: expect.stringContaining("メールアドレスが無効です"),
        variant: "destructive",
        duration: 5000,
      });
      expect(mockLogger.log).toHaveBeenCalledWith(error, "warn");
    });

    it("should NOT display toast for AuthenticationError", () => {
      const error = new AuthenticationError("Unauthorized");
      handler.handle(error);

      expect(mockToast).not.toHaveBeenCalled();
      expect(mockLogger.log).toHaveBeenCalledWith(error, "warn");
    });

    it("should handle unexpected errors", () => {
      const error = new Error("Unexpected error");
      handler.handle(error);

      expect(mockToast).toHaveBeenCalledWith({
        title: "システムエラー",
        description:
          "予期しないエラーが発生しました。しばらくしてから再度お試しください。",
        variant: "destructive",
        duration: 5000,
      });
      expect(mockLogger.log).toHaveBeenCalledWith(expect.any(Error), "error");
    });
  });

  describe("Configuration", () => {
    it("should not show toast when disabled", () => {
      const handler = GlobalErrorHandler.initialize({
        toast: mockToast,
        logger: mockLogger,
        environment: "development",
        enableToast: false,
      });

      const error = new ApiError("Test error", 400);
      handler.handle(error);

      expect(mockToast).not.toHaveBeenCalled();
      expect(mockLogger.log).toHaveBeenCalledWith(error, "error");
    });

    it("should not log when logging is disabled", () => {
      const handler = GlobalErrorHandler.initialize({
        toast: mockToast,
        logger: mockLogger,
        environment: "development",
        enableLogging: false,
      });

      const error = new ApiError("Test error", 400);
      handler.handle(error);

      expect(mockToast).toHaveBeenCalled();
      expect(mockLogger.log).not.toHaveBeenCalled();
    });
  });
});
