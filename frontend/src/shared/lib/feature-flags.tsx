import { type ReactNode, useState } from "react";

import type { FeatureFlagsContextType } from "./feature-flags-context";
import { FeatureFlagsContext } from "./feature-flags-context";

// Fixed: Separate constants into a different file to resolve React refresh warning
export type FeatureFlags = {
  NEW_UI_DESIGN: boolean;
  DARK_MODE: boolean;
  ANALYTICS: boolean;
  BETA_FEATURES: boolean;
};

// Default feature flags - these could be moved to a separate constants file
const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  NEW_UI_DESIGN: false,
  DARK_MODE: true,
  ANALYTICS: true,
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

  const updateFlag = (flag: keyof FeatureFlags, value: boolean): void => {
    setFlags((prev) => ({
      ...prev,
      [flag]: value,
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
