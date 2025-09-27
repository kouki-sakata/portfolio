import React, { useCallback, useEffect, useState } from 'react'

import {
  FEATURE_FLAGS,
  getFeatureFlag,
  setFeatureFlag,
  STORAGE_KEY_PREFIX
} from './feature-flags-constants'
import { FeatureFlagContext } from './feature-flags-context'

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