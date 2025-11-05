import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ProfileActivityResponse,
  ProfileMetadataUpdatePayload,
  ProfileResponse,
} from "@/features/profile/api/profileApi";
import * as profileApi from "@/features/profile/api/profileApi";
import type {
  ExtendedProfileOverviewViewModel,
  ProfileMetadataFormValues,
} from "@/features/profile/types";
import {
  useProfileActivityQuery,
  useProfileOverviewQuery,
  useUpdateProfileMetadata,
} from "./useProfile";

vi.mock("@/features/profile/api/profileApi");

const baseProfileResponse: ProfileResponse = {
  employee: {
    id: 9000,
    fullName: "坂田 晃輝",
    email: "profile@example.com",
    admin: false,
    updatedAt: "2025-11-04T03:00:00Z",
  },
  metadata: {
    address: "",
    department: "プロダクト開発部",
    employeeNumber: "EMP-9000",
    activityNote: "   ",
    location: "大阪/梅田",
    manager: "",
    workStyle: "remote",
    schedule: {
      start: "09:00",
      end: "18:00",
      breakMinutes: 60,
    },
    status: "",
    joinedAt: "",
    avatarUrl: "",
  },
};

const updatedProfileResponse: ProfileResponse = {
  ...baseProfileResponse,
  metadata: {
    ...baseProfileResponse.metadata,
    department: "DX推進室",
    location: "東京/丸の内",
    schedule: {
      start: "10:00",
      end: "19:00",
      breakMinutes: 45,
    },
  },
  employee: {
    ...baseProfileResponse.employee,
    updatedAt: "2025-11-04T04:10:00Z",
  },
};

const activityResponse: ProfileActivityResponse = {
  page: 1,
  size: 10,
  totalPages: 1,
  totalElements: 2,
  items: [
    {
      id: "evt-1",
      occurredAt: "2025-11-04T09:00:00Z",
      actor: "坂田 晃輝",
      operationType: "UNKNOWN",
      summary: "ロケーションを更新",
      changedFields: ["location"],
      beforeSnapshot: undefined as unknown as Record<string, string | null>,
      afterSnapshot: undefined as unknown as Record<string, string | null>,
    },
    {
      id: "evt-2",
      occurredAt: "2025-11-03T20:00:00Z",
      actor: "坂田 晃輝",
      operationType: "VIEW",
      summary: "プロフィールを閲覧",
      changedFields: [],
      beforeSnapshot: {},
      afterSnapshot: {},
    },
  ],
};

const PROFILE_OVERVIEW_KEY = ["profile", "overview"] as const;

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useProfile hooks", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("normalize overview view model and metadata form values", async () => {
    vi.mocked(profileApi.fetchProfile).mockResolvedValue(baseProfileResponse);
    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(() => useProfileOverviewQuery(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const overview = result.current.data?.overview;
    const metadataForm = result.current.data?.metadataForm;

    expect(overview?.fullName).toBe("坂田 晃輝");
    expect(overview?.activityNote).toBeNull();
    expect(overview?.status).toBe("active");
    expect(overview?.address).toBeNull();
    expect(metadataForm?.department).toBe("プロダクト開発部");
    expect(metadataForm?.address).toBe("");
    expect(metadataForm?.workStyle).toBe("remote");
  });

  it("provides normalized activity entries with stable snapshots", async () => {
    vi.mocked(profileApi.fetchProfileActivity).mockResolvedValue(
      activityResponse
    );
    const queryClient = createTestQueryClient();
    const wrapper = createWrapper(queryClient);

    const { result } = renderHook(
      () => useProfileActivityQuery({ page: 1, size: 10 }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const entries = result.current.data?.entries ?? [];
    expect(entries).toHaveLength(2);
    const first = entries[0];
    expect(first?.operationType).toBe("UPDATE");
    expect(first?.beforeSnapshot).toEqual({});
    expect(first?.afterSnapshot).toEqual({});
    expect(result.current.data?.totalCount).toBe(2);
    expect(result.current.data?.page).toBe(1);
  });

  it("updates cached overview after successful metadata mutation", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(PROFILE_OVERVIEW_KEY, {
      overview: {
        fullName: baseProfileResponse.employee.fullName,
        email: baseProfileResponse.employee.email,
        employeeNumber: baseProfileResponse.metadata.employeeNumber,
        department: baseProfileResponse.metadata.department,
        address: null,
        updatedAt: baseProfileResponse.employee.updatedAt,
        activityNote: null,
        status: "active",
        joinedAt: "",
        manager: null,
        workStyle: "remote",
        schedule: {
          start: "09:00",
          end: "18:00",
          breakMinutes: 60,
        },
        location: baseProfileResponse.metadata.location,
      },
      metadataForm: {
        address: "",
        department: baseProfileResponse.metadata.department,
        employeeNumber: baseProfileResponse.metadata.employeeNumber,
        activityNote: "",
        location: baseProfileResponse.metadata.location,
        manager: "",
        workStyle: "remote",
        scheduleStart: "09:00",
        scheduleEnd: "18:00",
        scheduleBreakMinutes: 60,
      },
      raw: baseProfileResponse,
    });
    const wrapper = createWrapper(queryClient);

    vi.mocked(profileApi.updateProfileMetadata).mockImplementation(
      async (payload: ProfileMetadataUpdatePayload) => ({
        ...updatedProfileResponse,
        metadata: {
          ...updatedProfileResponse.metadata,
          department:
            payload.department ?? updatedProfileResponse.metadata.department,
        },
      })
    );

    const { result } = renderHook(() => useUpdateProfileMetadata(), {
      wrapper,
    });

    await act(async () => {
      await result.current.mutateAsync({
        department: "DX推進室",
      });
    });

    const cached = queryClient.getQueryData<{
      overview: ExtendedProfileOverviewViewModel | null;
      metadataForm: ProfileMetadataFormValues;
      raw: ProfileResponse | null;
    }>(PROFILE_OVERVIEW_KEY);

    expect(cached?.overview?.department).toBe("DX推進室");
    expect(cached?.overview?.location).toBe("東京/丸の内");
    expect(cached?.metadataForm?.scheduleBreakMinutes).toBe(45);
  });
});
