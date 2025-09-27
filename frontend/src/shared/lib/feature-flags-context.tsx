import { createContext } from 'react';

import type { FeatureFlags } from './feature-flags';

export interface FeatureFlagsContextType {
  flags: FeatureFlags;
  isEnabled: (flag: keyof FeatureFlags) => boolean;
  updateFlag: (flag: keyof FeatureFlags, value: boolean) => void;
}

export const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);