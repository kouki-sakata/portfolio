export interface EmployeeSummary {
  id: number
  firstName: string
  lastName: string
  email: string
  admin: boolean
}

export interface SessionResponse {
  authenticated: boolean
  employee: EmployeeSummary | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  employee: EmployeeSummary
}
