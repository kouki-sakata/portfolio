// Feature flag names as constants
export const FEATURE_FLAGS = {
  USE_SHADCN_BUTTON: 'USE_SHADCN_BUTTON',
  USE_SHADCN_CARD: 'USE_SHADCN_CARD',
  USE_SHADCN_INPUT: 'USE_SHADCN_INPUT',
} as const

export type FeatureFlagName = keyof typeof FEATURE_FLAGS

// Storage key prefix for localStorage
export const STORAGE_KEY_PREFIX = 'feature-flag:'

// Get environment variable for a feature flag
function getEnvFlag(flagName: string): boolean | undefined {
  const envVar = `VITE_FEATURE_${flagName}`
  const value = import.meta.env[envVar] as string | undefined

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
    localStorage.setItem(storageKey, 'false')
  }

  // Trigger custom event for cross-tab sync
  // Using try-catch for test environment compatibility
  try {
    window.dispatchEvent(new StorageEvent('storage', {
      key: storageKey,
      newValue: value.toString(),
      storageArea: localStorage,
      url: window.location.href,
    }))
  } catch {
    // In test environment, use CustomEvent as fallback
    const event = new CustomEvent('feature-flag-change', {
      detail: { flag: flagName, value },
    })
    window.dispatchEvent(event)
  }
}

// Reset all feature flags
export function resetFeatureFlags(): void {
  Object.values(FEATURE_FLAGS).forEach(flag => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${flag}`)
  })
}