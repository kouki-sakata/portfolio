import { httpClient } from '@/shared/api/httpClient'

import type { LoginRequest, LoginResponse } from '../types'

export const login = async (payload: LoginRequest) =>
  httpClient<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
