import { useContext } from 'react'

import { FeatureFlagContext } from './feature-flags-context'

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