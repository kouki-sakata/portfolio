import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api/axiosClient", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import { api } from "@/shared/api/axiosClient";
import { ApiError } from "@/shared/api/errors/ApiError";
import { AuthorizationError } from "@/shared/api/errors/AuthorizationError";

import {
  deleteStamp,
  deleteStampsBatch,
  fetchStampHistory,
  updateStamp,
  updateStampsBatch,
} from "./stampApi";

const mockedApi = vi.mocked(api);

describe("stampApi", () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.post.mockReset();
    mockedApi.put.mockReset();
    mockedApi.delete.mockReset();
  });

  it("fetches stamp history with query params and calculates summary", async () => {
    mockedApi.get.mockResolvedValue({
      selectedYear: "2024",
      selectedMonth: "04",
      years: ["2023", "2024"],
      months: ["03", "04"],
      entries: [
        {
          id: 1,
          year: "2024",
          month: "04",
          day: "01",
          dayOfWeek: "月",
          inTime: "09:00",
          outTime: "18:00",
          updateDate: "2024-04-01T18:05",
        },
        {
          id: 2,
          year: "2024",
          month: "04",
          day: "02",
          dayOfWeek: "火",
          inTime: "09:30",
          outTime: null,
          updateDate: null,
        },
      ],
    });

    const result = await fetchStampHistory({ year: "2024", month: "04" });

    expect(mockedApi.get).toHaveBeenCalledWith("/stamp-history", {
      params: { year: "2024", month: "04" },
    });
    expect(result.selectedYear).toBe("2024");
    expect(result.selectedMonth).toBe("04");
    expect(result.entries).toHaveLength(2);
    expect(result.summary).toEqual({
      totalWorkingDays: 2,
      presentDays: 1,
      absentDays: 1,
      totalWorkingHours: 9,
      averageWorkingHours: 9,
    });
  });

  it("raises AuthorizationError when updating stamp without permission", async () => {
    mockedApi.put.mockRejectedValue(
      new ApiError("Forbidden", 403, undefined, {
        requiredRole: "ADMIN",
      })
    );

    await expect(
      updateStamp({ id: 42, inTime: "09:00", outTime: "18:00" })
    ).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("raises AuthorizationError when deleting stamp without permission", async () => {
    mockedApi.delete.mockRejectedValue(new ApiError("Forbidden", 403));

    await expect(deleteStamp({ id: 24 })).rejects.toBeInstanceOf(
      AuthorizationError
    );
  });

  it("updates multiple stamps sequentially when using batch helper", async () => {
    mockedApi.put.mockResolvedValue(undefined);

    await updateStampsBatch([
      { id: 1, inTime: "09:00", outTime: "18:00" },
      { id: 2, inTime: "10:00" },
    ]);

    expect(mockedApi.put).toHaveBeenCalledTimes(2);
    expect(mockedApi.put).toHaveBeenNthCalledWith(1, "/stamps/1", {
      inTime: "09:00",
      outTime: "18:00",
    });
    expect(mockedApi.put).toHaveBeenNthCalledWith(2, "/stamps/2", {
      inTime: "10:00",
    });
  });

  it("deletes multiple stamps sequentially when using batch helper", async () => {
    mockedApi.delete.mockResolvedValue(undefined);

    await deleteStampsBatch([3, 4, 5]);

    expect(mockedApi.delete).toHaveBeenCalledTimes(3);
    expect(mockedApi.delete).toHaveBeenNthCalledWith(1, "/stamps/3");
    expect(mockedApi.delete).toHaveBeenNthCalledWith(2, "/stamps/4");
    expect(mockedApi.delete).toHaveBeenNthCalledWith(3, "/stamps/5");
  });
});
