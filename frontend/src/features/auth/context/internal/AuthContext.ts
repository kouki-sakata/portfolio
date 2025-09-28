import { createContext } from 'react'

import type { EnhancedAuthContextValue } from '@/features/auth/types/auth-context.types'

// AuthContextValue型をエクスポート（EnhancedAuthContextValueのエイリアスとして）
export type AuthContextValue = EnhancedAuthContextValue

export const AuthContext = createContext<EnhancedAuthContextValue | undefined>(undefined)
