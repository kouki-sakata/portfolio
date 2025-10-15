import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { IHomeRepository } from "@/features/home/repositories/HomeRepository";
import type { StampResponse } from "@/features/home/types";
import { useStamp } from "@/features/home/hooks/useStamp";
import type { HttpClientError } from "@/shared/api/httpClient";

// toast関数をモック
vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

// formatLocalTimestampをモック
vi.mock("@/shared/utils/date", () => ({
  formatLocalTimestamp: vi.fn(),
}));

import { toast } from "@/hooks/use-toast";
import { formatLocalTimestamp } from "@/shared/utils/date";

describe("useStamp", () => {
  let queryClient: QueryClient;
  let mockRepository: IHomeRepository;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    mockRepository = {
      getDashboard: vi.fn(),
      submitStamp: vi.fn(),
    };
    vi.clearAllMocks();
    // formatLocalTimestampを固定値でモック
    vi.mocked(formatLocalTimestamp).mockReturnValue("2025-10-15T09:00:00+09:00");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("成功時の処理", () => {
    it("出勤打刻が成功したときにメッセージを設定し、toastを表示する", async () => {
      const mockResponse: StampResponse = {
        message: "出勤打刻が完了しました",
      };

      vi.mocked(mockRepository.submitStamp).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      await act(async () => {
        await result.current.handleStamp("1", false);
      });

      await waitFor(() => {
        expect(result.current.message).toBe("出勤打刻が完了しました");
      });

      expect(toast).toHaveBeenCalledWith({
        title: "成功",
        description: "出勤打刻が完了しました",
      });
    });

    it("退勤打刻が成功したときにメッセージを設定し、toastを表示する", async () => {
      const mockResponse: StampResponse = {
        message: "退勤打刻が完了しました",
      };

      vi.mocked(mockRepository.submitStamp).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      await act(async () => {
        await result.current.handleStamp("2", false);
      });

      await waitFor(() => {
        expect(result.current.message).toBe("退勤打刻が完了しました");
      });

      expect(toast).toHaveBeenCalledWith({
        title: "成功",
        description: "退勤打刻が完了しました",
      });
    });
  });

  describe("409 Conflict エラーハンドリング", () => {
    it("409エラー発生時、payloadのメッセージを表示する", async () => {
      const error: HttpClientError = {
        name: "HttpClientError",
        message: "Conflict",
        status: 409,
        payload: {
          message:
            "打刻時刻が既に登録されています: 出勤 (2025-10-15T09:00:00+09:00)",
        },
      };

      vi.mocked(mockRepository.submitStamp).mockRejectedValue(error);

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.handleStamp("1", false);
        } catch {
          // mutateAsync throws error, but onError handles it
        }
      });

      await waitFor(() => {
        expect(result.current.message).toBe(
          "打刻時刻が既に登録されています: 出勤 (2025-10-15T09:00:00+09:00)"
        );
      });

      expect(toast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "重複打刻エラー",
        description:
          "打刻時刻が既に登録されています: 出勤 (2025-10-15T09:00:00+09:00)",
      });
    });

    it("409エラー発生時、payloadがない場合はデフォルトメッセージを表示する", async () => {
      const error: HttpClientError = {
        name: "HttpClientError",
        message: "Conflict",
        status: 409,
        payload: {},
      };

      vi.mocked(mockRepository.submitStamp).mockRejectedValue(error);

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.handleStamp("1", false);
        } catch {
          // mutateAsync throws error, but onError handles it
        }
      });

      await waitFor(() => {
        expect(result.current.message).toBe(
          "既に打刻済みです。同じ日に同じ種別の打刻はできません。"
        );
      });

      expect(toast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "重複打刻エラー",
        description: "既に打刻済みです。同じ日に同じ種別の打刻はできません。",
      });
    });

    it("409エラー時には他のエラーハンドリングをスキップする", async () => {
      const error: HttpClientError = {
        name: "HttpClientError",
        message: "Conflict",
        status: 409,
        payload: {
          message: "重複エラー",
        },
      };

      vi.mocked(mockRepository.submitStamp).mockRejectedValue(error);

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.handleStamp("1", false);
        } catch {
          // mutateAsync throws error, but onError handles it
        }
      });

      await waitFor(() => {
        expect(toast).toHaveBeenCalledTimes(1);
      });

      // 409専用のtoastのみ呼ばれることを確認
      expect(toast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "重複打刻エラー",
        description: "重複エラー",
      });
    });
  });

  describe("二重送信防止機構（デバウンス）", () => {
    it("3秒以内に同じ種別の打刻を試みた場合、エラーメッセージを表示する（出勤）", async () => {
      const mockResponse: StampResponse = {
        message: "出勤打刻が完了しました",
      };

      vi.mocked(mockRepository.submitStamp).mockResolvedValue(mockResponse);

      const startTime = 1000000000000;
      const dateSpy = vi.spyOn(Date, "now");

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      // 1回目の打刻
      dateSpy.mockReturnValueOnce(startTime);
      await act(async () => {
        await result.current.handleStamp("1", false);
      });

      await waitFor(() => {
        expect(result.current.message).toBe("出勤打刻が完了しました");
      });

      // 2回目の打刻を試みる（2秒後なのでブロックされる）
      dateSpy.mockReturnValueOnce(startTime + 2000);
      await act(async () => {
        await result.current.handleStamp("1", false);
      });

      // デバウンスによりtoastが呼ばれる
      expect(toast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "二重送信防止",
        description: "短時間での連続出勤打刻はできません。あと1秒お待ちください。",
      });

      // submitStampは1回しか呼ばれていないことを確認
      expect(mockRepository.submitStamp).toHaveBeenCalledTimes(1);

      dateSpy.mockRestore();
    });

    it("3秒以内に同じ種別の打刻を試みた場合、エラーメッセージを表示する（退勤）", async () => {
      const mockResponse: StampResponse = {
        message: "退勤打刻が完了しました",
      };

      vi.mocked(mockRepository.submitStamp).mockResolvedValue(mockResponse);

      const startTime = 1000000000000;
      const dateSpy = vi.spyOn(Date, "now");

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      // 1回目の打刻
      dateSpy.mockReturnValueOnce(startTime);
      await act(async () => {
        await result.current.handleStamp("2", false);
      });

      await waitFor(() => {
        expect(result.current.message).toBe("退勤打刻が完了しました");
      });

      // 2回目の打刻を試みる（1秒後なのでブロックされる）
      dateSpy.mockReturnValueOnce(startTime + 1000);
      await act(async () => {
        await result.current.handleStamp("2", false);
      });

      // デバウンスによりtoastが呼ばれる
      expect(toast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "二重送信防止",
        description: "短時間での連続退勤打刻はできません。あと2秒お待ちください。",
      });

      // submitStampは1回しか呼ばれていないことを確認
      expect(mockRepository.submitStamp).toHaveBeenCalledTimes(1);

      dateSpy.mockRestore();
    });

    it("3秒経過後は正常に打刻できる", async () => {
      const mockResponse: StampResponse = {
        message: "出勤打刻が完了しました",
      };

      vi.mocked(mockRepository.submitStamp).mockResolvedValue(mockResponse);

      const startTime = 1000000000000;
      const dateSpy = vi.spyOn(Date, "now");

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      // 1回目の打刻
      dateSpy.mockReturnValueOnce(startTime);
      await act(async () => {
        await result.current.handleStamp("1", false);
      });

      await waitFor(() => {
        expect(result.current.message).toBe("出勤打刻が完了しました");
      });

      // 2回目の打刻を試みる（3秒後なので成功する）
      dateSpy.mockReturnValueOnce(startTime + 3000);
      await act(async () => {
        await result.current.handleStamp("1", false);
      });

      await waitFor(() => {
        // submitStampが2回呼ばれていることを確認
        expect(mockRepository.submitStamp).toHaveBeenCalledTimes(2);
      });

      dateSpy.mockRestore();
    });

    it("異なる種別の打刻は独立してデバウンスされる", async () => {
      const mockResponse: StampResponse = {
        message: "打刻が完了しました",
      };

      vi.mocked(mockRepository.submitStamp).mockResolvedValue(mockResponse);

      const startTime = 1000000000000;
      const dateSpy = vi.spyOn(Date, "now");

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      // 出勤打刻
      dateSpy.mockReturnValueOnce(startTime);
      await act(async () => {
        await result.current.handleStamp("1", false);
      });

      await waitFor(() => {
        expect(mockRepository.submitStamp).toHaveBeenCalledTimes(1);
      });

      // 退勤打刻（異なる種別なので成功するはず）
      dateSpy.mockReturnValueOnce(startTime + 1000);
      await act(async () => {
        await result.current.handleStamp("2", false);
      });

      await waitFor(() => {
        expect(mockRepository.submitStamp).toHaveBeenCalledTimes(2);
      });

      dateSpy.mockRestore();
    });
  });

  describe("その他のエラーハンドリング", () => {
    it("ネットワークエラー時に適切なメッセージを表示する", async () => {
      const error: HttpClientError = {
        name: "HttpClientError",
        message: "Network error",
        status: 0,
        payload: null,
      };

      vi.mocked(mockRepository.submitStamp).mockRejectedValue(error);

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.handleStamp("1", false);
        } catch {
          // mutateAsync throws error, but onError handles it
        }
      });

      await waitFor(() => {
        expect(result.current.message).toBe(
          "打刻に失敗しました。再度お試しください。"
        );
      });

      expect(toast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "ネットワークエラー",
        description: "通信エラーが発生しました。接続を確認してください。",
      });
    });

    it("タイムアウトエラー時に適切なメッセージを表示する", async () => {
      const error = new Error("Request timeout");

      vi.mocked(mockRepository.submitStamp).mockRejectedValue(error);

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.handleStamp("1", false);
        } catch {
          // mutateAsync throws error, but onError handles it
        }
      });

      await waitFor(() => {
        expect(result.current.message).toBe(
          "打刻に失敗しました。再度お試しください。"
        );
      });

      expect(toast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "タイムアウト",
        description:
          "リクエストがタイムアウトしました。しばらくしてから再度お試しください。",
      });
    });

    it("サーバーエラー (500) 時に適切なメッセージを表示する", async () => {
      const error = new Error("Internal Server Error: 500");

      vi.mocked(mockRepository.submitStamp).mockRejectedValue(error);

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.handleStamp("1", false);
        } catch {
          // mutateAsync throws error, but onError handles it
        }
      });

      await waitFor(() => {
        expect(result.current.message).toBe(
          "打刻に失敗しました。再度お試しください。"
        );
      });

      expect(toast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "サーバーエラー",
        description:
          "サーバーエラーが発生しました。しばらくしてから再度お試しください。",
      });
    });

    it("汎用エラー時に適切なメッセージを表示する", async () => {
      const error = new Error("Unknown error");

      vi.mocked(mockRepository.submitStamp).mockRejectedValue(error);

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      await act(async () => {
        try {
          await result.current.handleStamp("1", false);
        } catch {
          // mutateAsync throws error, but onError handles it
        }
      });

      await waitFor(() => {
        expect(result.current.message).toBe(
          "打刻に失敗しました。再度お試しください。"
        );
      });

      expect(toast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "エラー",
        description: "打刻に失敗しました。再度お試しください。",
      });
    });
  });

  describe("ユーティリティ関数", () => {
    it("clearMessage関数でメッセージをクリアできる", async () => {
      const mockResponse: StampResponse = {
        message: "出勤打刻が完了しました",
      };

      vi.mocked(mockRepository.submitStamp).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      // 打刻してメッセージを設定
      await act(async () => {
        await result.current.handleStamp("1", false);
      });

      await waitFor(() => {
        expect(result.current.message).toBe("出勤打刻が完了しました");
      });

      // メッセージをクリア
      act(() => {
        result.current.clearMessage();
      });

      // 状態更新を待つ
      await waitFor(() => {
        expect(result.current.message).toBeNull();
      });
    });
  });

  describe("ローディング状態", () => {
    it("打刻中はisLoadingがtrueになり、完了後にfalseになる", async () => {
      const mockResponse: StampResponse = {
        message: "出勤打刻が完了しました",
      };

      let resolveStamp!: (value: StampResponse) => void;
      const stampPromise = new Promise<StampResponse>((resolve) => {
        resolveStamp = resolve;
      });

      vi.mocked(mockRepository.submitStamp).mockReturnValue(stampPromise);

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      expect(result.current.isLoading).toBe(false);

      // 打刻を開始（await しない）
      act(() => {
        result.current.handleStamp("1", false);
      });

      // ローディング状態になることを確認
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      // リクエストを完了させる
      await act(async () => {
        resolveStamp(mockResponse);
        await Promise.resolve();
      });

      // ローディング状態が解除されることを確認
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("夜勤フラグの処理", () => {
    it("夜勤フラグがtrueの場合、正しいリクエストを送信する", async () => {
      const mockResponse: StampResponse = {
        message: "退勤打刻が完了しました（夜勤）",
      };

      vi.mocked(mockRepository.submitStamp).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      await act(async () => {
        await result.current.handleStamp("2", true);
      });

      await waitFor(() => {
        expect(mockRepository.submitStamp).toHaveBeenCalledWith(
          expect.objectContaining({
            stampType: "2",
            nightWorkFlag: "1",
          })
        );
      });
    });

    it("夜勤フラグがfalseの場合、正しいリクエストを送信する", async () => {
      const mockResponse: StampResponse = {
        message: "出勤打刻が完了しました",
      };

      vi.mocked(mockRepository.submitStamp).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useStamp(mockRepository), {
        wrapper,
      });

      await act(async () => {
        await result.current.handleStamp("1", false);
      });

      await waitFor(() => {
        expect(mockRepository.submitStamp).toHaveBeenCalledWith(
          expect.objectContaining({
            stampType: "1",
            nightWorkFlag: "0",
          })
        );
      });
    });
  });
});
