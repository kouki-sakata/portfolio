import {
  type QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEnhancedQueryClient } from "@/app/config/enhanced-query-client";
import {
  ApiError,
  AuthenticationError,
  NetworkError,
  UnexpectedError,
  ValidationError,
} from "../api/errors";
import { ErrorBoundary } from "./ErrorBoundary";
import { ErrorFallback } from "./ErrorFallback";
import { GlobalErrorHandler } from "./index";

// Mock console.error to suppress React ErrorBoundary warnings in tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});
afterEach(() => {
  console.error = originalError;
});

describe("Error Handling System Integration", () => {
  const mockToast = vi.fn();
  const mockOnLogout = vi.fn().mockResolvedValue(undefined);
  const mockOnRedirect = vi.fn();
  let queryClient: QueryClient;

  beforeEach(() => {
    GlobalErrorHandler.reset();
    vi.clearAllMocks();

    // 統合環境の設定
    queryClient = createEnhancedQueryClient({
      toast: mockToast,
      onLogout: mockOnLogout,
      onRedirect: mockOnRedirect,
      environment: "development",
    });
  });

  afterEach(() => {
    GlobalErrorHandler.reset();
    queryClient.clear();
  });

  describe("ErrorBoundary + ErrorFallback Integration", () => {
    const ThrowError: React.FC<{ error: Error }> = ({ error }) => {
      throw error;
    };

    it("should catch component errors and display ErrorFallback UI", () => {
      const error = new UnexpectedError("Component crashed");

      render(
        <ErrorBoundary fallback={ErrorFallback}>
          <ThrowError error={error} />
        </ErrorBoundary>
      );

      expect(
        screen.getByRole("heading", { name: /エラーが発生しました/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /再試行/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /ホームに戻る/i })
      ).toBeInTheDocument();
    });

    it("should reset error state when reset button is clicked", async () => {
      let shouldThrow = true;

      const ConditionalError: React.FC = () => {
        if (shouldThrow) {
          throw new Error("Conditional error");
        }
        return <div>Component recovered</div>;
      };

      const { rerender } = render(
        <ErrorBoundary fallback={ErrorFallback}>
          <ConditionalError />
        </ErrorBoundary>
      );

      // エラーフォールバックが表示される
      expect(
        screen.getByRole("heading", { name: /エラーが発生しました/i })
      ).toBeInTheDocument();

      // リセットボタンをクリック
      shouldThrow = false;
      const resetButton = screen.getByRole("button", { name: /再試行/i });
      fireEvent.click(resetButton);

      // 再レンダリング
      rerender(
        <ErrorBoundary fallback={ErrorFallback}>
          <ConditionalError />
        </ErrorBoundary>
      );

      // コンポーネントが復旧
      await waitFor(() => {
        expect(screen.getByText("Component recovered")).toBeInTheDocument();
      });
    });
  });

  describe("React Query + GlobalErrorHandler Integration", () => {
    const TestQueryComponent: React.FC = () => {
      const { data, error, isLoading } = useQuery({
        queryKey: ["test-query"],
        queryFn: () => {
          throw new NetworkError(
            "API request failed",
            new Error("Network error")
          );
        },
        retry: false,
      });

      if (isLoading) {
        return <div>Loading...</div>;
      }
      if (error) {
        return <div>Query error occurred</div>;
      }
      return <div>Data: {JSON.stringify(data)}</div>;
    };

    it("should handle query errors through GlobalErrorHandler", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <TestQueryComponent />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Query error occurred")).toBeInTheDocument();
      });

      // GlobalErrorHandlerがtoastを呼び出したことを確認
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "ネットワークエラー",
          description: expect.stringContaining("ネットワーク"),
          variant: "destructive",
        })
      );
    });

    const TestMutationComponent: React.FC = () => {
      const mutation = useMutation({
        mutationFn: () => {
          throw new ValidationError("Form validation failed", 422, {
            email: ["メールアドレスが無効です"],
            password: ["パスワードが短すぎます"],
          });
        },
      });

      return (
        <div>
          <button onClick={() => mutation.mutate()} type="button">
            Submit
          </button>
          {mutation.isError && <div>Mutation error occurred</div>}
        </div>
      );
    };

    it("should handle mutation errors through GlobalErrorHandler", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <TestMutationComponent />
        </QueryClientProvider>
      );

      const submitButton = screen.getByRole("button", { name: "Submit" });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Mutation error occurred")).toBeInTheDocument();
      });

      // GlobalErrorHandlerがtoastを呼び出したことを確認
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "入力エラー",
          variant: "destructive",
        })
      );
    });
  });

  describe("Authentication Error Handling", () => {
    const TestAuthComponent: React.FC = () => {
      const { error, isLoading } = useQuery({
        queryKey: ["auth-test"],
        queryFn: () => {
          throw new AuthenticationError("Session expired");
        },
        retry: false,
      });

      if (isLoading) {
        return <div>Loading...</div>;
      }
      if (error) {
        return <div>Authentication error</div>;
      }
      return <div>Authenticated</div>;
    };

    it("should handle authentication errors with logout and redirect", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <TestAuthComponent />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Authentication error")).toBeInTheDocument();
      });

      // ログアウトとリダイレクトが呼ばれたことを確認
      await waitFor(() => {
        expect(mockOnLogout).toHaveBeenCalled();
        expect(mockOnRedirect).toHaveBeenCalledWith("/signin");
      });

      // 認証エラーではToastを表示しない
      expect(mockToast).not.toHaveBeenCalled();
    });
  });

  describe("Complete Error Flow with ErrorBoundary + React Query", () => {
    const TestCompleteFlow: React.FC = () => {
      const [throwError, setThrowError] = useState(false);

      const query = useQuery({
        queryKey: ["complete-test", throwError],
        queryFn: () => {
          if (throwError) {
            throw new ApiError("Server error", 500);
          }
          return { data: "Success" };
        },
        retry: false,
      });

      if (query.isLoading) {
        return <div>Loading...</div>;
      }
      if (query.error) {
        return <div>Error: {query.error.message}</div>;
      }

      return (
        <div>
          <div>Data: {query.data?.data}</div>
          <button onClick={() => setThrowError(true)} type="button">
            Trigger Error
          </button>
        </div>
      );
    };

    it("should handle complete error flow with recovery", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary
            fallback={ErrorFallback}
            resetQueries={() => queryClient.resetQueries()}
          >
            <TestCompleteFlow />
          </ErrorBoundary>
        </QueryClientProvider>
      );

      // 初期状態: データが正常に表示される
      await waitFor(() => {
        expect(screen.getByText("Data: Success")).toBeInTheDocument();
      });

      // エラーをトリガー
      const triggerButton = screen.getByRole("button", {
        name: "Trigger Error",
      });
      fireEvent.click(triggerButton);

      // React Queryのリフェッチを待つ
      await waitFor(() => {
        expect(screen.getByText(/Error: Server error/)).toBeInTheDocument();
      });

      // GlobalErrorHandlerがエラーを処理
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "サーバーエラー",
          variant: "destructive",
        })
      );
    });
  });

  describe("Error Retry Mechanism", () => {
    it("should retry network errors automatically", async () => {
      let attemptCount = 0;

      const TestRetryComponent: React.FC = () => {
        const { data, error, isLoading } = useQuery({
          queryKey: ["retry-test"],
          queryFn: () => {
            attemptCount++;
            if (attemptCount < 3) {
              throw new NetworkError(
                "Network unstable",
                new Error("Connection lost")
              );
            }
            return { data: "Success after retry" };
          },
        });

        if (isLoading) {
          return <div>Loading...</div>;
        }
        if (error) {
          return <div>Final error</div>;
        }
        return <div>Data: {data?.data}</div>;
      };

      render(
        <QueryClientProvider client={queryClient}>
          <TestRetryComponent />
        </QueryClientProvider>
      );

      // 再試行後に成功
      await waitFor(
        () => {
          expect(
            screen.getByText("Data: Success after retry")
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );

      // 3回試行されたことを確認
      expect(attemptCount).toBe(3);
    });

    it("should not retry authentication errors", async () => {
      let attemptCount = 0;

      const TestNoRetryComponent: React.FC = () => {
        const { data, error, isLoading } = useQuery({
          queryKey: ["no-retry-test"],
          queryFn: () => {
            attemptCount++;
            throw new AuthenticationError("Invalid token");
          },
        });

        if (isLoading) {
          return <div>Loading...</div>;
        }
        if (error) {
          return <div>Auth error</div>;
        }
        return <div>Data: {JSON.stringify(data)}</div>;
      };

      render(
        <QueryClientProvider client={queryClient}>
          <TestNoRetryComponent />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Auth error")).toBeInTheDocument();
      });

      // 1回のみ試行されたことを確認（再試行なし）
      expect(attemptCount).toBe(1);
    });
  });

  describe("Error Logging", () => {
    it("should log errors with appropriate severity", async () => {
      const mockLogger = {
        log: vi.fn(),
        sendToRemote: vi.fn().mockResolvedValue(undefined),
      };

      // カスタムロガーでGlobalErrorHandlerを再初期化
      GlobalErrorHandler.reset();
      GlobalErrorHandler.initialize({
        toast: mockToast,
        logger: mockLogger,
        environment: "development", // developmentに変更してログを確認
      });

      const TestLoggingComponent: React.FC = () => {
        const { error } = useQuery({
          queryKey: ["logging-test"],
          queryFn: () => {
            throw new ApiError("Server error", 500);
          },
          retry: false,
        });

        if (error) {
          return <div>Error logged</div>;
        }
        return <div>No error</div>;
      };

      render(
        <QueryClientProvider client={queryClient}>
          <TestLoggingComponent />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Error logged")).toBeInTheDocument();
      });

      // エラーログが記録されたことを確認
      expect(mockLogger.log).toHaveBeenCalledWith(
        expect.any(ApiError),
        "error"
      );
    });
  });
});
