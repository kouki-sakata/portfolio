import { createContext } from 'react'

// React Context for Feature Flags
export interface FeatureFlagContextValue {
  flags: Record<string, boolean>
  setFlag: (flagName: string, value: boolean) => void
}

export const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null)