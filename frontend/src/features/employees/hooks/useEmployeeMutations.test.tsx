import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EmployeeSummary } from "@/features/auth/types";
import * as employeeApi from "@/features/employees/api";
import type { EmployeeListResponse } from "@/features/employees/types";
import { queryKeys } from "@/shared/utils/queryUtils";
import {
  useCreateEmployee,
  useDeleteEmployees,
  useUpdateEmployee,
} from "./useEmployeeMutations";
import { EMPLOYEES_QUERY_KEY } from "./useEmployees";

vi.mock("@/features/employees/api");

const initialEmployees: EmployeeListResponse = {
  employees: [
    {
      id: 1,
      firstName: "太郎",
      lastName: "山田",
      email: "taro@example.com",
      admin: false,
    },
  ],
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper: Wrapper, queryClient };
};

describe("employee mutations optimistic updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("optimistically adds a new employee and invalidates the list", async () => {
    const { wrapper: Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(EMPLOYEES_QUERY_KEY, initialEmployees);

    const newEmployee: EmployeeSummary & { password: string } = {
      id: 2,
      firstName: "花子",
      lastName: "鈴木",
      email: "hanako@example.com",
      admin: true,
      password: "password123",
    };

    vi.mocked(employeeApi.createEmployee).mockResolvedValue({ ...newEmployee });

    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreateEmployee(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        email: newEmployee.email,
        admin: newEmployee.admin,
        password: newEmployee.password,
      });
    });

    await waitFor(() => {
      const optimisticData =
        queryClient.getQueryData<EmployeeListResponse>(EMPLOYEES_QUERY_KEY);
      expect(optimisticData?.employees).toHaveLength(2);
      expect(optimisticData?.employees.at(-1)).toMatchObject({
        firstName: newEmployee.firstName,
        email: newEmployee.email,
        admin: newEmployee.admin,
      });
    });

    await waitFor(() => {
      expect(employeeApi.createEmployee).toHaveBeenCalledWith({
        firstName: newEmployee.firstName,
        lastName: newEmployee.lastName,
        email: newEmployee.email,
        admin: newEmployee.admin,
        password: newEmployee.password,
      });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.employees.all,
      });
    });
  });

  it("rolls back the cache if create employee fails", async () => {
    const { wrapper: Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(EMPLOYEES_QUERY_KEY, initialEmployees);

    vi.mocked(employeeApi.createEmployee).mockRejectedValue(
      new Error("create failed")
    );

    const { result } = renderHook(() => useCreateEmployee(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({
        firstName: "花子",
        lastName: "鈴木",
        email: "hanako@example.com",
        admin: true,
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(result.current.isError || result.current.error).toBeTruthy();
    });

    const restoredData =
      queryClient.getQueryData<EmployeeListResponse>(EMPLOYEES_QUERY_KEY);
    expect(restoredData).toEqual(initialEmployees);
  });

  it("optimistically updates an employee entry", async () => {
    const { wrapper: Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(EMPLOYEES_QUERY_KEY, initialEmployees);

    vi.mocked(employeeApi.updateEmployee).mockImplementation(
      async (_id, payload) => ({
        id: 1,
        firstName: payload.firstName ?? "太郎",
        lastName: payload.lastName ?? "山田",
        email: payload.email ?? "taro@example.com",
        admin: payload.admin ?? false,
      })
    );

    const { result } = renderHook(() => useUpdateEmployee(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({
        id: 1,
        firstName: "新太郎",
        lastName: "山田",
        email: "taro@example.com",
        admin: true,
      });
    });

    await waitFor(() => {
      const optimisticData =
        queryClient.getQueryData<EmployeeListResponse>(EMPLOYEES_QUERY_KEY);

      expect(optimisticData?.employees.at(0)).toMatchObject({
        id: 1,
        firstName: "新太郎",
        admin: true,
      });
    });
  });

  it("restores previous state when update fails", async () => {
    const { wrapper: Wrapper, queryClient } = createWrapper();
    queryClient.setQueryData(EMPLOYEES_QUERY_KEY, initialEmployees);

    vi.mocked(employeeApi.updateEmployee).mockRejectedValue(
      new Error("update failed")
    );

    const { result } = renderHook(() => useUpdateEmployee(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate({
        id: 1,
        firstName: "壊れた",
        lastName: "山田",
        email: "taro@example.com",
        admin: true,
      });
    });

    await waitFor(() => {
      expect(result.current.isError || result.current.error).toBeTruthy();
    });

    const restoredData =
      queryClient.getQueryData<EmployeeListResponse>(EMPLOYEES_QUERY_KEY);
    expect(restoredData).toEqual(initialEmployees);
  });

  it("optimistically removes employees for bulk delete", async () => {
    const { wrapper: Wrapper, queryClient } = createWrapper();
    const employeesWithTwo: EmployeeListResponse = {
      employees: [
        ...initialEmployees.employees,
        {
          id: 2,
          firstName: "花子",
          lastName: "鈴木",
          email: "hanako@example.com",
          admin: true,
        },
      ],
    };
    queryClient.setQueryData(EMPLOYEES_QUERY_KEY, employeesWithTwo);

    vi.mocked(employeeApi.deleteEmployee).mockResolvedValue();

    const { result } = renderHook(() => useDeleteEmployees(), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.mutate([1, 2]);
    });

    await waitFor(() => {
      const optimisticData =
        queryClient.getQueryData<EmployeeListResponse>(EMPLOYEES_QUERY_KEY);
      expect(optimisticData?.employees).toHaveLength(0);
    });
  });
});
