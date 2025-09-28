import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface FeatureFlags {
  useShadcnUI: boolean;
}

interface FeatureFlagContextValue {
  flags: FeatureFlags;
  toggleFlag: (flag: keyof FeatureFlags) => void;
  setFlag: (flag: keyof FeatureFlags, value: boolean) => void;
  isEnabled: (flag: keyof FeatureFlags) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

const DEFAULT_FLAGS: FeatureFlags = {
  useShadcnUI: false,
};

const STORAGE_KEY = 'featureFlags';

interface FeatureFlagProviderProps {
  children: ReactNode;
  initialFlags?: Partial<FeatureFlags>;
}

export const FeatureFlagProvider = ({
  children,
  initialFlags
}: FeatureFlagProviderProps) => {
  const [flags, setFlags] = useState<FeatureFlags>(() => {
    // Try to load from localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return { ...DEFAULT_FLAGS, ...parsed, ...initialFlags };
        } catch (error) {
          console.error('Failed to parse stored feature flags:', error);
        }
      }
    }
    return { ...DEFAULT_FLAGS, ...initialFlags };
  });

  // Persist to localStorage whenever flags change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
    }
  }, [flags]);

  const toggleFlag = (flag: keyof FeatureFlags) => {
    setFlags(prev => ({
      ...prev,
      [flag]: !prev[flag],
    }));
  };

  const setFlag = (flag: keyof FeatureFlags, value: boolean) => {
    setFlags(prev => ({
      ...prev,
      [flag]: value,
    }));
  };

  const isEnabled = (flag: keyof FeatureFlags): boolean => {
    return flags[flag];
  };

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

export const useFeatureFlag = (): FeatureFlagContextValue => {
  const context = useContext(FeatureFlagContext);

  if (!context) {
    throw new Error('useFeatureFlag must be used within a FeatureFlagProvider');
  }

  return context;
};