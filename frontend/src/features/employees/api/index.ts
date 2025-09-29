import type { EmployeeSummary } from "@/features/auth/types";
import type { EmployeeListResponse } from "@/features/employees/types";
import { httpClient } from "@/shared/api/httpClient";

export const fetchEmployees = async (adminOnly = false) =>
  httpClient<EmployeeListResponse>(
    `/employees?adminOnly=${adminOnly ? "true" : "false"}`
  );

export const createEmployee = async (
  payload: Omit<EmployeeSummary, "id"> & { password: string }
) =>
  httpClient<EmployeeSummary>("/employees", {
    method: "POST",
    body: JSON.stringify({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: payload.password,
      admin: payload.admin,
    }),
  });

export const updateEmployee = async (
  employeeId: number,
  payload: Partial<Omit<EmployeeSummary, "id">> & { password?: string }
) =>
  httpClient<EmployeeSummary>(`/employees/${String(employeeId)}`, {
    method: "PUT",
    body: JSON.stringify({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: payload.password,
      admin: payload.admin,
    }),
  });

export const deleteEmployee = async (employeeId: number) => {
  await httpClient<undefined>("/employees", {
    method: "DELETE",
    body: JSON.stringify({ ids: [employeeId] }),
    parseJson: false,
  });
};
