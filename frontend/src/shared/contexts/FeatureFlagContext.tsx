import { type ReactNode, useEffect, useState } from "react";

import {
  FeatureFlagContext,
  type FeatureFlagContextValue,
  type FeatureFlags,
} from "../hooks/use-feature-flag";

const DEFAULT_FLAGS: FeatureFlags = {
  useShadcnUI: false,
};

const STORAGE_KEY = "featureFlags";

type FeatureFlagProviderProps = {
  children: ReactNode;
  initialFlags?: Partial<FeatureFlags>;
};

export const FeatureFlagProvider = ({
  children,
  initialFlags,
}: FeatureFlagProviderProps) => {
  const [flags, setFlags] = useState<FeatureFlags>(() => {
    // Try to load from localStorage first
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Partial<FeatureFlags>;
          return { ...DEFAULT_FLAGS, ...parsed, ...initialFlags };
        } catch (_error) {}
      }
    }
    return { ...DEFAULT_FLAGS, ...initialFlags };
  });

  // Persist to localStorage whenever flags change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
    }
  }, [flags]);

  const toggleFlag = (flag: keyof FeatureFlags) => {
    setFlags((prev) => ({
      ...prev,
      [flag]: !prev[flag],
    }));
  };

  const setFlag = (flag: keyof FeatureFlags, value: boolean) => {
    setFlags((prev) => ({
      ...prev,
      [flag]: value,
    }));
  };

  const isEnabled = (flag: keyof FeatureFlags): boolean => flags[flag];

  const value: FeatureFlagContextValue = {
    flags,
    toggleFlag,
    setFlag,
    isEnabled,
  };

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

// useFeatureFlag has been moved to ../hooks/use-feature-flag
