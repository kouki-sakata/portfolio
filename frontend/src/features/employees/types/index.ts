import type { EmployeeSummary } from "@/features/auth/types";

export type EmployeeListResponse = {
  employees: EmployeeSummary[];
};

export type EmployeeUpsertInput = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  admin: boolean;
};
