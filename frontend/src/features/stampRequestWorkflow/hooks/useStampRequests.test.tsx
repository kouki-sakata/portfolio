import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import * as api from "@/features/stampRequestWorkflow/api/stampRequestApi";
import {
  stampRequestQueryKeys,
  useCancelStampRequestMutation,
  useCreateStampRequestMutation,
} from "@/features/stampRequestWorkflow/hooks/useStampRequests";
import type { StampRequestCancelPayload } from "@/features/stampRequestWorkflow/types";
import { queryKeys } from "@/shared/utils/queryUtils";

vi.mock("@/features/stampRequestWorkflow/api/stampRequestApi");
vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, queryClient, invalidateSpy };
};

describe("useStampRequests mutations", () => {
  it("invalidates caches and toasts on successful create", async () => {
    const payload = {
      stampHistoryId: 45,
      requestedInTime: "09:00",
      requestedOutTime: "18:00",
      reason: "長時間残業のため修正します。",
    };
    vi.mocked(api.createStampRequest).mockResolvedValue({
      id: 999,
      status: "PENDING",
    } as never);

    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useCreateStampRequestMutation(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    await waitFor(() => {
      expect(api.createStampRequest).toHaveBeenCalledWith(payload);
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: stampRequestQueryKeys.root,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.stampHistory.all,
    });
  });

  it("invalidates caches when cancelling a request", async () => {
    const payload: StampRequestCancelPayload = {
      requestId: 101,
      reason: "操作ミスのため取り消します。",
    };
    vi.mocked(api.cancelStampRequest).mockResolvedValue(undefined);

    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useCancelStampRequestMutation(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync(payload);
    });

    expect(api.cancelStampRequest).toHaveBeenCalledWith(payload);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: stampRequestQueryKeys.root,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.stampHistory.all,
    });
  });
});
