import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type UseStampOptions, useStamp } from "@/features/home/hooks/useStamp";
import type { IHomeRepository } from "@/features/home/repositories/HomeRepository";
import type { StampResponse } from "@/features/home/types";
import { ApiError } from "@/shared/api/errors/ApiError";

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/shared/utils/date", () => ({
  formatLocalTimestamp: vi.fn(),
}));

import { toast } from "@/hooks/use-toast";
import { formatLocalTimestamp } from "@/shared/utils/date";

describe("useStamp", () => {
  let queryClient: QueryClient;
  let mockRepository: IHomeRepository;

  const iso = "2025-10-15T09:00:00+09:00";

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

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
      toggleBreak: vi.fn(),
    };

    vi.clearAllMocks();
    vi.mocked(formatLocalTimestamp).mockReturnValue(iso);
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderStampHook = (options?: UseStampOptions) =>
    renderHook(() => useStamp(mockRepository, options), { wrapper });

  describe("成功時の処理", () => {
    it("明示的なタイムスタンプで打刻し、成功ステータスを返す", async () => {
      const response: StampResponse = { message: "出勤打刻が完了しました" };
      vi.mocked(mockRepository.submitStamp).mockResolvedValue(response);

      const { result } = renderStampHook();

      await act(async () => {
        await result.current.handleStamp("1", false, iso);
      });

      expect(mockRepository.submitStamp).toHaveBeenCalledWith({
        stampType: "1",
        stampTime: iso,
        nightWorkFlag: "0",
      });

      await waitFor(() => {
        expect(result.current.status).toEqual({
          message: "出勤打刻が完了しました",
          submittedAt: iso,
          type: "1",
          result: "success",
        });
      });

      expect(toast).toHaveBeenCalledWith({
        title: "成功",
        description: "出勤打刻が完了しました",
      });
    });

    it("timestampProviderが指定されている場合はそれを使用する", async () => {
      const response: StampResponse = { message: "退勤打刻が完了しました" };
      vi.mocked(mockRepository.submitStamp).mockResolvedValue(response);

      const provider = vi.fn().mockReturnValue("2025-10-15T18:00:00+09:00");
      const { result } = renderStampHook({ timestampProvider: provider });

      await act(async () => {
        await result.current.handleStamp("2", true);
      });

      expect(provider).toHaveBeenCalled();
      expect(mockRepository.submitStamp).toHaveBeenCalledWith({
        stampType: "2",
        stampTime: "2025-10-15T18:00:00+09:00",
        nightWorkFlag: "1",
      });

      await waitFor(() => {
        expect(result.current.status).toEqual({
          message: "退勤打刻が完了しました",
          submittedAt: "2025-10-15T18:00:00+09:00",
          type: "2",
          result: "success",
        });
      });
    });

    it("onStampCapturedが指定されている場合は打刻開始時に呼び出す", async () => {
      const response: StampResponse = { message: "出勤打刻が完了しました" };
      vi.mocked(mockRepository.submitStamp).mockResolvedValue(response);

      const provider = vi.fn().mockReturnValue("2025-10-15T09:30:00+09:00");
      const onStampCaptured = vi.fn();

      const { result } = renderStampHook({
        timestampProvider: provider,
        onStampCaptured,
      });

      await act(async () => {
        await result.current.handleStamp("1", false);
      });

      expect(onStampCaptured).toHaveBeenCalledWith({
        iso: "2025-10-15T09:30:00+09:00",
        type: "1",
      });
    });

    it("providerも引数もない場合はformatLocalTimestampを利用する", async () => {
      const response: StampResponse = { message: "出勤打刻が完了しました" };
      vi.mocked(mockRepository.submitStamp).mockResolvedValue(response);

      const { result } = renderStampHook();

      await act(async () => {
        await result.current.handleStamp("1", false);
      });

      expect(formatLocalTimestamp).toHaveBeenCalled();
      expect(mockRepository.submitStamp).toHaveBeenCalledWith({
        stampType: "1",
        stampTime: iso,
        nightWorkFlag: "0",
      });
    });
  });

  describe("409 Conflict エラーハンドリング", () => {
    it("サーバーが提供するメッセージを結果に反映する", async () => {
      const error = new ApiError("Conflict", 409, "VALIDATION_ERROR", {
        message:
          "打刻時刻が既に登録されています: 出勤 (2025-10-15T09:00:00+09:00)",
      });

      vi.mocked(mockRepository.submitStamp).mockRejectedValue(error);

      const { result } = renderStampHook();

      await act(async () => {
        try {
          await result.current.handleStamp("1", false, iso);
        } catch {
          // mutateAsync throws error, handled below
        }
      });

      await waitFor(() => {
        expect(result.current.status).toEqual({
          message:
            "打刻時刻が既に登録されています: 出勤 (2025-10-15T09:00:00+09:00)",
          submittedAt: iso,
          type: "1",
          result: "conflict",
        });
      });

      expect(toast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "重複打刻エラー",
        description:
          "打刻時刻が既に登録されています: 出勤 (2025-10-15T09:00:00+09:00)",
      });
    });

    it("payloadが無い場合はデフォルトメッセージを返す", async () => {
      const error = new ApiError("Conflict", 409);
      vi.mocked(mockRepository.submitStamp).mockRejectedValue(error);

      const { result } = renderStampHook();

      await act(async () => {
        try {
          await result.current.handleStamp("1", false, iso);
        } catch {
          // noop
        }
      });

      await waitFor(() => {
        expect(result.current.status).toEqual({
          message: "既に打刻済みです。同じ日に同じ種別の打刻はできません。",
          submittedAt: iso,
          type: "1",
          result: "conflict",
        });
      });
    });
  });

  describe("二重送信防止機構", () => {
    it("3秒以内の同種別打刻をブロックし、トーストを表示する", async () => {
      const response: StampResponse = { message: "出勤打刻が完了しました" };
      vi.mocked(mockRepository.submitStamp).mockResolvedValue(response);

      const nowSpy = vi.spyOn(Date, "now");
      nowSpy.mockReturnValue(1_000_000_000_000);

      const { result } = renderStampHook();

      await act(async () => {
        await result.current.handleStamp("1", false, iso);
      });

      await waitFor(() => {
        expect(result.current.status?.result).toBe("success");
      });

      nowSpy.mockReturnValue(1_000_000_000_000 + 2000);

      await act(async () => {
        await result.current.handleStamp("1", false, iso);
      });

      expect(toast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "二重送信防止",
        description:
          "短時間での連続出勤打刻はできません。あと1秒お待ちください。",
      });

      expect(mockRepository.submitStamp).toHaveBeenCalledTimes(1);
      nowSpy.mockRestore();
    });

    it("異なる種別の打刻は独立して許可される", async () => {
      const response: StampResponse = { message: "打刻が完了しました" };
      vi.mocked(mockRepository.submitStamp).mockResolvedValue(response);

      const nowSpy = vi.spyOn(Date, "now");
      nowSpy.mockReturnValue(1_000_000_000_000);

      const { result } = renderStampHook();

      await act(async () => {
        await result.current.handleStamp("1", false, iso);
      });

      nowSpy.mockReturnValue(1_000_000_000_000 + 1000);

      await act(async () => {
        await result.current.handleStamp("2", false, iso);
      });

      expect(mockRepository.submitStamp).toHaveBeenCalledTimes(2);
      nowSpy.mockRestore();
    });
  });

  describe("その他のエラー処理", () => {
    it("ネットワークエラー時はエラーステータスを返す", async () => {
      const error = new ApiError("Network Error", 0, "NETWORK_ERROR");
      vi.mocked(mockRepository.submitStamp).mockRejectedValue(error);

      const { result } = renderStampHook();

      await act(async () => {
        try {
          await result.current.handleStamp("1", false, iso);
        } catch {
          // noop
        }
      });

      await waitFor(() => {
        expect(result.current.status).toEqual({
          message: "通信エラーが発生しました。接続を確認してください。",
          submittedAt: iso,
          type: "1",
          result: "error",
        });
      });
    });

    it("タイムアウト時は専用メッセージを返す", async () => {
      const error = new Error("Request timeout");
      vi.mocked(mockRepository.submitStamp).mockRejectedValue(error);

      const { result } = renderStampHook();

      await act(async () => {
        try {
          await result.current.handleStamp("1", false, iso);
        } catch {
          // noop
        }
      });

      await waitFor(() => {
        expect(result.current.status).toEqual({
          message:
            "リクエストがタイムアウトしました。しばらくしてから再度お試しください。",
          submittedAt: iso,
          type: "1",
          result: "error",
        });
      });
    });

    it("汎用エラー時は共通メッセージを返す", async () => {
      const error = new Error("Unknown error");
      vi.mocked(mockRepository.submitStamp).mockRejectedValue(error);

      const { result } = renderStampHook();

      await act(async () => {
        try {
          await result.current.handleStamp("1", false, iso);
        } catch {
          // noop
        }
      });

      await waitFor(() => {
        expect(result.current.status).toEqual({
          message: "打刻に失敗しました。再度お試しください。",
          submittedAt: iso,
          type: "1",
          result: "error",
        });
      });
    });
  });

  describe("ユーティリティ", () => {
    it("clearStatusでステータスをクリアする", async () => {
      const response: StampResponse = { message: "出勤打刻が完了しました" };
      vi.mocked(mockRepository.submitStamp).mockResolvedValue(response);

      const { result } = renderStampHook();

      await act(async () => {
        await result.current.handleStamp("1", false, iso);
      });

      await waitFor(() => {
        expect(result.current.status).not.toBeNull();
      });

      act(() => {
        result.current.clearStatus();
      });

      await waitFor(() => {
        expect(result.current.status).toBeNull();
      });
    });
  });

  describe("ローディングと夜勤フラグ", () => {
    it("打刻中はローディング状態になる", async () => {
      const response: StampResponse = { message: "出勤打刻が完了しました" };

      let resolveStamp!: (value: StampResponse) => void;
      const promise = new Promise<StampResponse>((resolve) => {
        resolveStamp = resolve;
      });

      vi.mocked(mockRepository.submitStamp).mockReturnValue(promise);

      const { result } = renderStampHook();

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.handleStamp("1", false, iso);
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        resolveStamp(response);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("夜勤フラグがtrueの場合はnightWorkFlagが'1'になる", async () => {
      const response: StampResponse = { message: "退勤打刻が完了しました" };
      vi.mocked(mockRepository.submitStamp).mockResolvedValue(response);

      const { result } = renderStampHook();

      await act(async () => {
        await result.current.handleStamp("2", true, iso);
      });

      expect(mockRepository.submitStamp).toHaveBeenCalledWith({
        stampType: "2",
        stampTime: iso,
        nightWorkFlag: "1",
      });
    });

    it("夜勤フラグがfalseの場合はnightWorkFlagが'0'になる", async () => {
      const response: StampResponse = { message: "出勤打刻が完了しました" };
      vi.mocked(mockRepository.submitStamp).mockResolvedValue(response);

      const { result } = renderStampHook();

      await act(async () => {
        await result.current.handleStamp("1", false, iso);
      });

      expect(mockRepository.submitStamp).toHaveBeenCalledWith({
        stampType: "1",
        stampTime: iso,
        nightWorkFlag: "0",
      });
    });
  });
});
