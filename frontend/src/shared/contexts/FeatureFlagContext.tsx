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
const FEATURE_FLAG_ENDPOINT = "/api/public/feature-flags";

type FeatureFlagProviderProps = {
  children: ReactNode;
  initialFlags?: Partial<FeatureFlags>;
};

const mergeFlags = (
  current: FeatureFlags,
  incoming: Partial<FeatureFlags>
): FeatureFlags => ({
  ...current,
  ...incoming,
});

const hasDifferences = (
  current: FeatureFlags,
  incoming: Partial<FeatureFlags>
): boolean =>
  Object.entries(incoming).some(([key, value]) => {
    const typedKey = key as keyof FeatureFlags;
    return value !== undefined && current[typedKey] !== value;
  });

const isFeatureFlagsResponse = (
  value: unknown
): value is Partial<FeatureFlags> => {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Record<keyof FeatureFlags, unknown>>;

  if ("useShadcnUI" in candidate) {
    return typeof candidate.useShadcnUI === "boolean";
  }

  return true;
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
        } catch (_error) {
          // Silently fall back to defaults if localStorage data is invalid
        }
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const synchronizeFlags = async () => {
      try {
        const response = await fetch(FEATURE_FLAG_ENDPOINT, {
          credentials: "include",
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as unknown;

        if (!(isMounted && isFeatureFlagsResponse(payload))) {
          return;
        }

        setFlags((prev) => {
          if (!hasDifferences(prev, payload)) {
            return prev;
          }
          return mergeFlags(prev, payload);
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    };

    void synchronizeFlags();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const toggleFlag = (flag: keyof FeatureFlags) => {
    setFlags((prev) => ({
      ...prev,
      [flag]: !prev[flag],
    }));
  };

  const setFlag = (flag: keyof FeatureFlags, enabled: boolean) => {
    setFlags((prev) => ({
      ...prev,
      [flag]: enabled,
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
