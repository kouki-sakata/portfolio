import { useContext } from 'react';

import type { FeatureFlags } from './feature-flags';
import { FeatureFlagsContext } from './feature-flags-context';

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagsContext);
  
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  
  return context;
};

// Hook for checking a specific feature flag
export const useFeatureFlag = (flag: keyof FeatureFlags): boolean => {
  const { isEnabled } = useFeatureFlags();
  return isEnabled(flag);
};