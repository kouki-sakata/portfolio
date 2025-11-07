import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useBreakToggle } from "@/features/home/hooks/useBreakToggle";
import type { IHomeRepository } from "@/features/home/repositories/HomeRepository";

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/shared/utils/date", () => ({
  formatLocalTimestamp: vi.fn(() => "2025-11-06T12:00:00+09:00"),
}));

import { toast } from "@/hooks/use-toast";
import { formatLocalTimestamp } from "@/shared/utils/date";

describe("useBreakToggle", () => {
  let queryClient: QueryClient;
  let repository: IHomeRepository;

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

    repository = {
      getDashboard: vi.fn(),
      submitStamp: vi.fn(),
      toggleBreak: vi.fn().mockResolvedValue(undefined),
    };

    vi.clearAllMocks();
  });

  it("指定したタイムスタンプで休憩トグルAPIを呼び出す", async () => {
    const { result } = renderHook(() => useBreakToggle(repository), {
      wrapper,
    });

    await act(async () => {
      await result.current.toggleBreak("2025-11-06T13:00:00+09:00");
    });

    expect(repository.toggleBreak).toHaveBeenCalledWith(
      "2025-11-06T13:00:00+09:00"
    );
    expect(toast).toHaveBeenCalledWith({
      title: "成功",
      description: "休憩ステータスを更新しました",
    });
  });

  it("timestampProviderが指定されていればそれを利用する", async () => {
    const provider = vi.fn().mockReturnValue("2025-11-06T14:00:00+09:00");

    const { result } = renderHook(
      () => useBreakToggle(repository, { timestampProvider: provider }),
      { wrapper }
    );

    await act(async () => {
      await result.current.toggleBreak();
    });

    expect(provider).toHaveBeenCalled();
    expect(repository.toggleBreak).toHaveBeenCalledWith(
      "2025-11-06T14:00:00+09:00"
    );
  });

  it("providerが未指定の場合はformatLocalTimestampを使う", async () => {
    const { result } = renderHook(() => useBreakToggle(repository), {
      wrapper,
    });

    await act(async () => {
      await result.current.toggleBreak();
    });

    expect(formatLocalTimestamp).toHaveBeenCalled();
    expect(repository.toggleBreak).toHaveBeenCalledWith(
      "2025-11-06T12:00:00+09:00"
    );
  });

  it("エラー時はトーストを表示する", async () => {
    const error = new Error("toggle failed");
    vi.mocked(repository.toggleBreak).mockRejectedValue(error);

    const { result } = renderHook(() => useBreakToggle(repository), {
      wrapper,
    });

    await act(async () => {
      await expect(result.current.toggleBreak()).rejects.toThrow(
        "toggle failed"
      );
    });

    expect(toast).toHaveBeenCalledWith({
      variant: "destructive",
      title: "エラー",
      description: "toggle failed",
    });
  });
});
