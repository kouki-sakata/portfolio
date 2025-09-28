import { createContext } from 'react'

import type { EnhancedAuthContextValue } from '@/features/auth/types/auth-context.types'

export const AuthContext = createContext<EnhancedAuthContextValue | undefined>(undefined)
