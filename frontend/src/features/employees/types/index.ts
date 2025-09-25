import type { EmployeeSummary } from '@/features/auth/types'

export interface EmployeeListResponse {
  employees: EmployeeSummary[]
}

export interface EmployeeUpsertInput {
  firstName: string
  lastName: string
  email: string
  password?: string
  admin: boolean
}
