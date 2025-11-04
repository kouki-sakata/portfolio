import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api/axiosClient", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import { api } from "@/shared/api/axiosClient";

import {
  fetchProfile,
  fetchProfileActivity,
  updateProfileMetadata,
} from "./profileApi";

const mockedApi = vi.mocked(api);

const sampleProfile = {
  employee: {
    id: 1,
    fullName: "坂田 晃輝",
    email: "test@example.com",
    admin: false,
    updatedAt: "2025-11-04T03:00:00Z",
  },
  metadata: {
    address: "大阪府大阪市",
    department: "開発部",
    employeeNumber: "EMP-0001",
    activityNote: "テストユーザー",
    location: "大阪/梅田",
    manager: "上長 一郎",
    workStyle: "hybrid",
    schedule: {
      start: "09:30",
      end: "18:30",
      breakMinutes: 60,
    },
    status: "active",
    joinedAt: "2024-04-01",
    avatarUrl: "",
  },
};

const sampleActivity = {
  page: 0,
  size: 20,
  totalPages: 1,
  totalElements: 1,
  items: [
    {
      id: "evt-1",
      occurredAt: "2025-11-04T09:00:00Z",
      actor: "坂田 晃輝",
      operationType: "UPDATE",
      summary: "住所を更新",
      changedFields: ["address"],
      beforeSnapshot: { address: "旧住所" },
      afterSnapshot: { address: "新住所" },
    },
  ],
};

describe("profileApi", () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.patch.mockReset();
  });

  it("fetches current profile", async () => {
    mockedApi.get.mockResolvedValue(sampleProfile);

    const result = await fetchProfile();

    expect(mockedApi.get).toHaveBeenCalledWith("/profile/me");
    expect(result).toStrictEqual(sampleProfile);
  });

  it("updates profile metadata", async () => {
    mockedApi.patch.mockResolvedValue(sampleProfile);

    const payload = {
      address: "東京都",
      department: "DX推進室",
      scheduleStart: "10:00",
      scheduleEnd: "19:00",
      scheduleBreakMinutes: 45,
    };

    const result = await updateProfileMetadata(payload);

    expect(mockedApi.patch).toHaveBeenCalledWith(
      "/profile/me/metadata",
      payload
    );
    expect(result).toStrictEqual(sampleProfile);
  });

  it("fetches activity with query params", async () => {
    mockedApi.get.mockResolvedValue(sampleActivity);

    const result = await fetchProfileActivity({ page: 1, size: 10 });

    expect(mockedApi.get).toHaveBeenCalledWith("/profile/me/activity", {
      params: { page: 1, size: 10 },
    });
    expect(result).toStrictEqual(sampleActivity);
  });
});
