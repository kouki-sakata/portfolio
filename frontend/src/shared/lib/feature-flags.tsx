import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import {
  FEATURE_FLAGS,
  type FeatureFlagName,
  getFeatureFlag,
  resetFeatureFlags,
  setFeatureFlag,
  STORAGE_KEY_PREFIX} from './feature-flags-constants'

// Re-export constants and functions from feature-flags-constants
export {
  FEATURE_FLAGS,
  type FeatureFlagName,
  getFeatureFlag,
  resetFeatureFlags,
  setFeatureFlag} from './feature-flags-constants'

// React Context for Feature Flags
interface FeatureFlagContextValue {
  flags: Record<string, boolean>
  setFlag: (flagName: string, value: boolean) => void
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null)

// Feature Flag Provider Component
export function FeatureFlagProvider({ children }: { children: React.ReactNode }) {
  const [flags, setFlags] = useState<Record<string, boolean>>(() => {
    // Initialize with current flag values
    const initialFlags: Record<string, boolean> = {}
    Object.values(FEATURE_FLAGS).forEach(flagName => {
      initialFlags[flagName] = getFeatureFlag(flagName)
    })
    return initialFlags
  })

  const setFlag = useCallback((flagName: string, value: boolean) => {
    setFeatureFlag(flagName, value)
    setFlags(prev => ({
      ...prev,
      [flagName]: value
    }))
  }, [])

  // Listen for storage events (cross-tab sync)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.startsWith(STORAGE_KEY_PREFIX)) {
        const flagName = event.key.replace(STORAGE_KEY_PREFIX, '')
        const newValue = event.newValue === 'true'

        setFlags(prev => ({
          ...prev,
          [flagName]: newValue
        }))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return (
    <FeatureFlagContext.Provider value={{ flags, setFlag }}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

// Hook to use feature flags
export function useFeatureFlag(flagName: string): [boolean, (value: boolean) => void] {
  const context = useContext(FeatureFlagContext)

  if (!context) {
    throw new Error('useFeatureFlag must be used within a FeatureFlagProvider')
  }

  const flagValue = context.flags[flagName] ?? false
  const setFlagValue = (value: boolean): void => { context.setFlag(flagName, value) }

  return [flagValue, setFlagValue]
}