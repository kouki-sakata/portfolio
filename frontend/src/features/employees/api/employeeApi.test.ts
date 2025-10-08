import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EmployeeListResponse } from "@/features/employees/types";

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

// eslint-disable-next-line import/order
import {
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  updateEmployee,
} from "./index";

const mockedApi = vi.mocked(api);

describe("employeeApi", () => {
  beforeEach(() => {
    mockedApi.get.mockReset();
    mockedApi.post.mockReset();
    mockedApi.put.mockReset();
    mockedApi.delete.mockReset();
  });

  it("should request employee list with query params", async () => {
    const response: EmployeeListResponse = { employees: [] };
    mockedApi.get.mockResolvedValue(response);

    const result = await fetchEmployees({
      adminOnly: true,
      page: 2,
      size: 25,
      search: "john",
    });

    expect(mockedApi.get).toHaveBeenCalledWith("/employees", {
      params: {
        adminOnly: true,
        page: 2,
        size: 25,
        search: "john",
      },
    });
    expect(result).toBe(response);
  });

  it("retries list request when transient error occurs", async () => {
    const transientError = new ApiError("Network", 0, "NETWORK_ERROR");
    const response: EmployeeListResponse = { employees: [] };
    mockedApi.get
      .mockRejectedValueOnce(transientError)
      .mockResolvedValueOnce(response);

    const result = await fetchEmployees();

    expect(mockedApi.get).toHaveBeenCalledTimes(2);
    expect(result).toBe(response);
  });

  it("should create employee with payload", async () => {
    const newEmployee = {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      admin: false,
    };
    mockedApi.post.mockResolvedValue(newEmployee);

    const result = await createEmployee({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      password: "secret",
      admin: false,
    });

    expect(mockedApi.post).toHaveBeenCalledWith("/employees", {
      data: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "secret",
        admin: false,
      },
    });
    expect(result).toBe(newEmployee);
  });

  it("should update employee by id", async () => {
    const employee = {
      id: 1,
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      admin: true,
    };
    mockedApi.put.mockResolvedValue(employee);

    const result = await updateEmployee(1, {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      admin: true,
    });

    expect(mockedApi.put).toHaveBeenCalledWith("/employees/1", {
      data: {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        admin: true,
      },
    });
    expect(result).toBe(employee);
  });

  it("should send bulk ids when deleting employees", async () => {
    mockedApi.delete.mockResolvedValue(undefined);

    await deleteEmployee([1, 2, 3]);

    expect(mockedApi.delete).toHaveBeenCalledWith("/employees", {
      data: { ids: [1, 2, 3] },
    });
  });
});
