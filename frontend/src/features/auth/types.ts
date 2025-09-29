export type EmployeeSummary = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  admin: boolean;
};

export type SessionResponse = {
  authenticated: boolean;
  employee: EmployeeSummary | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  employee: EmployeeSummary;
};
