/**
 * Stamp Request Workflow Integration Tests
 *
 * Tests the complete flow using MSW + Vitest + React Query:
 * - Employee submits correction request
 * - Admin approves/rejects request
 * - Employee cancels pending request
 * - React Query cache invalidation
 * - Optimistic updates
 *
 * Requirements: 1, 2, 3, 4, 6, 7, 8, 9, 10
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { z } from "zod";
import type { schemas } from "@/schemas/api";
import { mswServer } from "@/test/msw/server";

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

// Mock hooks (to be implemented in actual feature)
import {
  useApproveRequest,
  useBulkApproveRequests,
  useCancelRequest,
  useCreateStampRequest,
  useMyRequests,
  usePendingRequests,
  useRejectRequest,
} from "../hooks/useStampRequestMutations";

describe("Stamp Request Workflow Integration", () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  describe("Employee Submission Flow", () => {
    it("submits correction request and invalidates My Requests cache", async () => {
      const employeeId = 1;
      const stampHistoryId = 100;

      // Mock empty initial state
      mswServer.use(
        http.get(/\/api\/stamp-requests\/my-requests/, () =>
          HttpResponse.json({
            requests: [],
            totalCount: 0,
            pageNumber: 0,
            pageSize: 10,
          } satisfies z.infer<typeof schemas.StampRequestListResponse>)
        )
      );

      const wrapper = createWrapper();

      // Step 1: Fetch initial My Requests (empty)
      const { result: myRequestsResult } = renderHook(
        () => useMyRequests({ status: "PENDING" }),
        { wrapper }
      );

      await waitFor(() => {
        expect(myRequestsResult.current.data?.requests).toEqual([]);
      });

      // Step 2: Submit new request
      const newRequest = {
        stampHistoryId,
        requestedInTime: "2025-11-14T09:00:00+09:00",
        requestedOutTime: "2025-11-14T18:00:00+09:00",
        reason: "家族の急用で退勤が遅れたため修正が必要です。",
      };

      const createdRequest = {
        id: 1,
        employeeId,
        status: "PENDING",
        ...newRequest,
        createdAt: "2025-11-15T10:00:00Z",
        updatedAt: "2025-11-15T10:00:00Z",
      } satisfies Partial<z.infer<typeof schemas.StampRequestResponse>>;

      // Mock POST /api/stamp-requests
      mswServer.use(
        http.post(/\/api\/stamp-requests$/, async ({ request }) => {
          const body = await request.json();
          expect(body).toMatchObject(newRequest);
          return HttpResponse.json(createdRequest, { status: 201 });
        }),

        // Mock updated My Requests after creation
        http.get(/\/api\/stamp-requests\/my-requests/, () =>
          HttpResponse.json({
            requests: [createdRequest],
            totalCount: 1,
            pageNumber: 0,
            pageSize: 10,
          } satisfies z.infer<typeof schemas.StampRequestListResponse>)
        )
      );

      const { result: createResult } = renderHook(
        () => useCreateStampRequest(),
        {
          wrapper,
        }
      );

      // Submit request
      await act(async () => {
        await createResult.current.mutateAsync(newRequest);
      });

      await waitFor(() => {
        expect(createResult.current.isSuccess).toBe(true);
      });

      // Step 3: Verify cache was invalidated and refetched
      await waitFor(() => {
        expect(myRequestsResult.current.data?.requests).toHaveLength(1);
        expect(myRequestsResult.current.data?.requests[0]).toMatchObject({
          id: 1,
          status: "PENDING",
        });
      });
    });

    it("prevents duplicate submission and shows error", async () => {
      const stampHistoryId = 100;

      const { result } = renderHook(() => useCreateStampRequest(), {
        wrapper: createWrapper(),
      });

      // Mock conflict error
      mswServer.use(
        http.post(/\/api\/stamp-requests$/, () =>
          HttpResponse.json(
            {
              message: "この勤怠記録に対して既に申請中のリクエストが存在します",
              code: "DUPLICATE_REQUEST",
            },
            { status: 409 }
          )
        )
      );

      const newRequest = {
        stampHistoryId,
        requestedInTime: "2025-11-14T09:00:00+09:00",
        requestedOutTime: "2025-11-14T18:00:00+09:00",
        reason: "重複リクエストのテストです。十分な長さ。",
      };

      await act(async () => {
        try {
          await result.current.mutateAsync(newRequest);
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("Admin Approval Flow", () => {
    it("approves request with optimistic update and cache invalidation", async () => {
      const requestId = 1;
      const adminId = 200;

      const pendingRequest = {
        id: requestId,
        employeeId: 100,
        status: "PENDING" as const,
        requestedInTime: "2025-11-14T09:00:00+09:00",
        requestedOutTime: "2025-11-14T18:00:00+09:00",
        reason: "修正が必要です。",
      } satisfies Partial<z.infer<typeof schemas.StampRequestResponse>>;

      const approvedRequest = {
        ...pendingRequest,
        status: "APPROVED" as const,
        approvalEmployeeId: adminId,
        approvalNote: "承認しました。",
        approvedAt: "2025-11-15T10:30:00Z",
      } satisfies Partial<z.infer<typeof schemas.StampRequestResponse>>;

      // Mock initial pending requests
      mswServer.use(
        http.get(/\/api\/stamp-requests\/pending/, () =>
          HttpResponse.json({
            requests: [pendingRequest],
            totalCount: 1,
            pageNumber: 0,
            pageSize: 10,
          } satisfies z.infer<typeof schemas.StampRequestListResponse>)
        )
      );

      const wrapper = createWrapper();
      const { result: pendingResult } = renderHook(() => usePendingRequests(), {
        wrapper,
      });

      await waitFor(() => {
        expect(pendingResult.current.data?.requests).toHaveLength(1);
      });

      // Mock approve endpoint
      mswServer.use(
        http.post(/\/api\/stamp-requests\/\d+\/approve/, () =>
          HttpResponse.json(approvedRequest)
        ),

        // Mock empty pending requests after approval
        http.get(/\/api\/stamp-requests\/pending/, () =>
          HttpResponse.json({
            requests: [],
            totalCount: 0,
            pageNumber: 0,
            pageSize: 10,
          } satisfies z.infer<typeof schemas.StampRequestListResponse>)
        )
      );

      const { result: approveResult } = renderHook(() => useApproveRequest(), {
        wrapper,
      });

      // Approve request
      await act(async () => {
        await approveResult.current.mutateAsync({
          requestId,
          approvalNote: "承認しました。",
        });
      });

      await waitFor(() => {


        expect(approveResult.current.isSuccess).toBe(true);


      });

      // Verify pending list was updated (request removed)
      await waitFor(() => {
        expect(pendingResult.current.data?.requests).toHaveLength(0);
      });
    });

    it("rejects request and updates cache", async () => {
      const requestId = 1;
      const adminId = 200;

      const pendingRequest = {
        id: requestId,
        employeeId: 100,
        status: "PENDING" as const,
      } satisfies Partial<z.infer<typeof schemas.StampRequestResponse>>;

      const rejectedRequest = {
        ...pendingRequest,
        status: "REJECTED" as const,
        rejectionEmployeeId: adminId,
        rejectionReason: "申請内容に不備があるため却下します。",
        rejectedAt: "2025-11-15T10:30:00Z",
      } satisfies Partial<z.infer<typeof schemas.StampRequestResponse>>;

      mswServer.use(
        http.post(/\/api\/stamp-requests\/\d+\/reject/, () =>
          HttpResponse.json(rejectedRequest)
        ),

        http.get(/\/api\/stamp-requests\/pending/, () =>
          HttpResponse.json({
            requests: [],
            totalCount: 0,
            pageNumber: 0,
            pageSize: 10,
          })
        )
      );

      const wrapper = createWrapper();
      const { result } = renderHook(() => useRejectRequest(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          requestId,
          rejectionReason: "申請内容に不備があるため却下します。",
        });
      });

      await waitFor(() => {


        expect(result.current.isSuccess).toBe(true);


      });
    });
  });

  describe("Employee Cancellation Flow", () => {
    it("cancels pending request and invalidates cache", async () => {
      const requestId = 1;

      const pendingRequest = {
        id: requestId,
        employeeId: 100,
        status: "PENDING" as const,
        requestedInTime: "2025-11-14T09:00:00+09:00",
        requestedOutTime: "2025-11-14T18:00:00+09:00",
        reason: "修正が必要です。",
      } satisfies Partial<z.infer<typeof schemas.StampRequestResponse>>;

      const cancelledRequest = {
        ...pendingRequest,
        status: "CANCELLED" as const,
        cancellationReason: "予定が変更になったため、キャンセルします。",
        cancelledAt: "2025-11-15T11:00:00Z",
      } satisfies Partial<z.infer<typeof schemas.StampRequestResponse>>;

      // Mock initial state
      mswServer.use(
        http.get(/\/api\/stamp-requests\/my-requests/, () =>
          HttpResponse.json({
            requests: [pendingRequest],
            totalCount: 1,
            pageNumber: 0,
            pageSize: 10,
          })
        )
      );

      const wrapper = createWrapper();
      const { result: myRequestsResult } = renderHook(
        () => useMyRequests({ status: "PENDING" }),
        { wrapper }
      );

      await waitFor(() => {
        expect(myRequestsResult.current.data?.requests).toHaveLength(1);
      });

      // Mock cancel endpoint
      mswServer.use(
        http.post(/\/api\/stamp-requests\/\d+\/cancel/, () =>
          HttpResponse.json(cancelledRequest)
        ),

        // Mock updated list (request moved to CANCELLED)
        http.get(/\/api\/stamp-requests\/my-requests/, ({ request }) => {
          const url = new URL(request.url);
          const status = url.searchParams.get("status");

          if (status === "PENDING") {
            return HttpResponse.json({
              requests: [],
              totalCount: 0,
              pageNumber: 0,
              pageSize: 10,
            });
          }
          if (status === "CANCELLED") {
            return HttpResponse.json({
              requests: [cancelledRequest],
              totalCount: 1,
              pageNumber: 0,
              pageSize: 10,
            });
          }
          return HttpResponse.json({
            requests: [],
            totalCount: 0,
            pageNumber: 0,
            pageSize: 10,
          });
        })
      );

      const { result: cancelResult } = renderHook(() => useCancelRequest(), {
        wrapper,
      });

      // Cancel request
      await act(async () => {
        await cancelResult.current.mutateAsync({
          requestId,
          reason: "予定が変更になったため、キャンセルします。",
        });
      });

      await waitFor(() => {


        expect(cancelResult.current.isSuccess).toBe(true);


      });

      // Verify PENDING list is now empty
      await waitFor(() => {
        expect(myRequestsResult.current.data?.requests).toHaveLength(0);
      });
    });

    it("prevents cancellation of approved request", async () => {
      const requestId = 1;

      mswServer.use(
        http.post(/\/api\/stamp-requests\/\d+\/cancel/, () =>
          HttpResponse.json(
            {
              message: "既に処理済みの申請は取り消せません",
              code: "INVALID_STATUS",
            },
            { status: 409 }
          )
        )
      );

      const { result } = renderHook(() => useCancelRequest(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            requestId,
            reason: "キャンセル試行。十分な長さがあります。",
          });
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe("Bulk Operations", () => {
    it("bulk approves multiple requests and updates cache", async () => {
      const requestIds = [1, 2, 3];

      const pendingRequests = requestIds.map((id) => ({
        id,
        employeeId: 100,
        status: "PENDING" as const,
      }));

      mswServer.use(
        http.get(/\/api\/stamp-requests\/pending/, () =>
          HttpResponse.json({
            requests: pendingRequests,
            totalCount: 3,
            pageNumber: 0,
            pageSize: 10,
          })
        )
      );

      const wrapper = createWrapper();
      const { result: pendingResult } = renderHook(() => usePendingRequests(), {
        wrapper,
      });

      await waitFor(() => {
        expect(pendingResult.current.data?.requests).toHaveLength(3);
      });

      // Mock bulk approve
      mswServer.use(
        http.post(/\/api\/stamp-requests\/bulk\/approve/, () =>
          HttpResponse.json({
            successCount: 3,
            failureCount: 0,
            failedRequestIds: [],
          } satisfies z.infer<typeof schemas.StampRequestBulkOperationResponse>)
        ),

        http.get(/\/api\/stamp-requests\/pending/, () =>
          HttpResponse.json({
            requests: [],
            totalCount: 0,
            pageNumber: 0,
            pageSize: 10,
          })
        )
      );

      const { result: bulkApproveResult } = renderHook(
        () => useBulkApproveRequests(),
        { wrapper }
      );

      await act(async () => {
        await bulkApproveResult.current.mutateAsync({
          requestIds,
          approvalNote: "一括承認しました。",
        });
      });

      await waitFor(() => {


        expect(bulkApproveResult.current.isSuccess).toBe(true);


      });
      expect(bulkApproveResult.current.data?.successCount).toBe(3);

      // Verify pending list is now empty
      await waitFor(() => {
        expect(pendingResult.current.data?.requests).toHaveLength(0);
      });
    });

    it("handles partial success in bulk operations", async () => {
      const requestIds = [1, 2, 3];

      mswServer.use(
        http.post(/\/api\/stamp-requests\/bulk\/approve/, () =>
          HttpResponse.json({
            successCount: 2,
            failureCount: 1,
            failedRequestIds: [2],
          } satisfies z.infer<typeof schemas.StampRequestBulkOperationResponse>)
        )
      );

      const { result } = renderHook(() => useBulkApproveRequests(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          requestIds,
          approvalNote: "一括承認",
        });
      });

      await waitFor(() => {
        expect(result.current.data?.successCount).toBe(2);
        expect(result.current.data?.failureCount).toBe(1);
        expect(result.current.data?.failedRequestIds).toContain(2);
      });
    });
  });
});
