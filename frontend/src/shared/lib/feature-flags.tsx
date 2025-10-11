import { type ReactNode, useState } from "react";

import type { FeatureFlagsContextType } from "./feature-flags-context";
import { FeatureFlagsContext } from "./feature-flags-context";

// Fixed: Separate constants into a different file to resolve React refresh warning
export type FeatureFlags = {
  // biome-ignore lint/style/useNamingConvention: Feature flags use UPPER_CASE by convention
  NEW_UI_DESIGN: boolean;
  // biome-ignore lint/style/useNamingConvention: Feature flags use UPPER_CASE by convention
  ANALYTICS: boolean;
  // biome-ignore lint/style/useNamingConvention: Feature flags use UPPER_CASE by convention
  BETA_FEATURES: boolean;
};

// Default feature flags - these could be moved to a separate constants file
const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // biome-ignore lint/style/useNamingConvention: Feature flag naming convention
  NEW_UI_DESIGN: false,
  // biome-ignore lint/style/useNamingConvention: Feature flag naming convention
  ANALYTICS: true,
  // biome-ignore lint/style/useNamingConvention: Feature flag naming convention
  BETA_FEATURES: false,
};

type FeatureFlagsProviderProps = {
  children: ReactNode;
  initialFlags?: Partial<FeatureFlags>;
};

export const FeatureFlagsProvider = ({
  children,
  initialFlags,
}: FeatureFlagsProviderProps) => {
  const [flags, setFlags] = useState<FeatureFlags>({
    ...DEFAULT_FEATURE_FLAGS,
    ...initialFlags,
  });

  const isEnabled = (flag: keyof FeatureFlags): boolean => flags[flag];

  const updateFlag = (flag: keyof FeatureFlags, enabled: boolean): void => {
    setFlags((prev) => ({
      ...prev,
      [flag]: enabled,
    }));
  };

  const value: FeatureFlagsContextType = {
    flags,
    isEnabled,
    updateFlag,
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};
