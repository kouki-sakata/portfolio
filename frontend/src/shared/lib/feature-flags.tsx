import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// Feature flag names as constants
export const FEATURE_FLAGS = {
  USE_SHADCN_BUTTON: 'USE_SHADCN_BUTTON',
  USE_SHADCN_CARD: 'USE_SHADCN_CARD',
  USE_SHADCN_INPUT: 'USE_SHADCN_INPUT',
} as const

export type FeatureFlagName = keyof typeof FEATURE_FLAGS

// Storage key prefix for localStorage
const STORAGE_KEY_PREFIX = 'feature-flag:'

// Get environment variable for a feature flag
function getEnvFlag(flagName: string): boolean | undefined {
  const envVar = `VITE_FEATURE_${flagName}`
  const value = import.meta.env[envVar]

  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

// Get feature flag value with environment variable priority
export function getFeatureFlag(flagName: string): boolean {
  // Check environment variable first (highest priority)
  const envValue = getEnvFlag(flagName)
  if (envValue !== undefined) {
    return envValue
  }

  // Check localStorage
  const storageKey = `${STORAGE_KEY_PREFIX}${flagName}`
  const storedValue = localStorage.getItem(storageKey)

  if (storedValue === 'true') return true
  if (storedValue === 'false') return false

  // Default to false
  return false
}

// Set feature flag value in localStorage
export function setFeatureFlag(flagName: string, value: boolean): void {
  const storageKey = `${STORAGE_KEY_PREFIX}${flagName}`

  if (value) {
    localStorage.setItem(storageKey, 'true')
  } else {
    // Remove from localStorage when false (to keep it clean)
    localStorage.removeItem(storageKey)
  }

  // Dispatch custom storage event for cross-tab sync
  // Note: In test environment (jsdom), StorageEvent doesn't support storageArea properly
  // so we create a custom event that mimics StorageEvent behavior
  try {
    const event = new StorageEvent('storage', {
      key: storageKey,
      newValue: value ? 'true' : null,
      storageArea: localStorage,
    })
    window.dispatchEvent(event)
  } catch (error) {
    // Fallback for test environment
    const event = new CustomEvent('storage', {
      detail: {
        key: storageKey,
        newValue: value ? 'true' : null,
      }
    }) as any
    // Add properties to mimic StorageEvent
    Object.defineProperty(event, 'key', { value: storageKey })
    Object.defineProperty(event, 'newValue', { value: value ? 'true' : null })
    window.dispatchEvent(event)
  }
}

// Reset all feature flags from localStorage
export function resetFeatureFlags(): void {
  // Get all keys from localStorage
  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      keysToRemove.push(key)
    }
  }

  // Remove all feature flag keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
  })
}

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
  const setFlagValue = (value: boolean) => context.setFlag(flagName, value)

  return [flagValue, setFlagValue]
}