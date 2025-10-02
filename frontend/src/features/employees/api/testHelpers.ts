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
  return fetchEmployees(false);
};

export const getEmployeeById = async (
  id: number
): Promise<EmployeeSummary> => {
  // For testing purposes, we return mock employee data
  // In real implementation, this would fetch a specific employee
  return {
    id,
    email: `employee${id}@example.com`,
    firstName: "Test",
    lastName: "Employee",
    admin: false,
  };
};