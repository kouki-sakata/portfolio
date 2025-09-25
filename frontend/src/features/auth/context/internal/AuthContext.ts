import { createContext } from 'react'

import type { EmployeeSummary, LoginRequest } from '@/features/auth/types'

export interface AuthContextValue {
  user: EmployeeSummary | null
  authenticated: boolean
  loading: boolean
  login: (payload: LoginRequest) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
