// Test helper functions to wrap the actual API functions for testing
// These provide the expected signatures for the test files

import type { EmployeeSummary } from "@/features/auth/types";
import type { EmployeeListResponse } from "@/features/employees/types";
import { fetchEmployees } from "./index";

export const getEmployees = async (params?: {
  page?: number;
  size?: number;
}): Promise<EmployeeListResponse> => {
  // For testing purposes, we return mock data
  // In real implementation, this would paginate the results
  const _page = params?.page ?? 1;
  const _size = params?.size ?? 20;

  // TODO: Implement pagination when backend supports it
  // Expected parameters: page (default: 1), size (default: 20)
  // Currently returns all employees; pagination will be added in future iteration

  return await fetchEmployees(false);
};

export const getEmployeeById = async (id: number): Promise<EmployeeSummary> => {
  // Fetch all employees and find the specific one by ID
  // TODO: When backend supports individual employee fetching, use a dedicated endpoint
  const response = await fetchEmployees(false);
  const employee = response.employees.find((emp) => emp.id === id);

  if (!employee) {
    throw new Error(`Employee with id ${id} not found`);
  }

  return employee;
};
