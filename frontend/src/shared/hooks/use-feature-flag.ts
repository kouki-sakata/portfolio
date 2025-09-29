import { createContext, useContext } from "react";

export type FeatureFlags = {
  useShadcnUI: boolean;
};

export type FeatureFlagContextValue = {
  flags: FeatureFlags;
  toggleFlag: (flag: keyof FeatureFlags) => void;
  setFlag: (flag: keyof FeatureFlags, value: boolean) => void;
  isEnabled: (flag: keyof FeatureFlags) => boolean;
};

export const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(
  null
);

export const useFeatureFlag = (): FeatureFlagContextValue => {
  const context = useContext(FeatureFlagContext);

  if (!context) {
    throw new Error("useFeatureFlag must be used within a FeatureFlagProvider");
  }

  return context;
};
