import { act, renderHook } from '@testing-library/react';
import { type ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useFeatureFlag } from '../../hooks/use-feature-flag';
import { FeatureFlagProvider } from '../FeatureFlagContext';

describe('FeatureFlagContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test to ensure isolation
    localStorage.clear();
  });

  describe('FeatureFlagProvider', () => {
    it('should provide default feature flags', () => {
      const { result } = renderHook(() => useFeatureFlag(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FeatureFlagProvider>{children}</FeatureFlagProvider>
        ),
      });

      expect(result.current.flags).toEqual({
        useShadcnUI: false,
      });
    });

    it('should allow custom initial flags', () => {
      const customFlags = { useShadcnUI: true };
      const { result } = renderHook(() => useFeatureFlag(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FeatureFlagProvider initialFlags={customFlags}>{children}</FeatureFlagProvider>
        ),
      });

      expect(result.current.flags.useShadcnUI).toBe(true);
    });
  });

  describe('useFeatureFlag hook', () => {
    it('should toggle a feature flag', () => {
      const { result } = renderHook(() => useFeatureFlag(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FeatureFlagProvider>{children}</FeatureFlagProvider>
        ),
      });

      expect(result.current.flags.useShadcnUI).toBe(false);

      act(() => {
        result.current.toggleFlag('useShadcnUI');
      });

      expect(result.current.flags.useShadcnUI).toBe(true);

      act(() => {
        result.current.toggleFlag('useShadcnUI');
      });

      expect(result.current.flags.useShadcnUI).toBe(false);
    });

    it('should set a specific feature flag value', () => {
      const { result } = renderHook(() => useFeatureFlag(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FeatureFlagProvider>{children}</FeatureFlagProvider>
        ),
      });

      act(() => {
        result.current.setFlag('useShadcnUI', true);
      });

      expect(result.current.flags.useShadcnUI).toBe(true);

      act(() => {
        result.current.setFlag('useShadcnUI', false);
      });

      expect(result.current.flags.useShadcnUI).toBe(false);
    });

    it('should check if a feature is enabled', () => {
      const { result } = renderHook(() => useFeatureFlag(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FeatureFlagProvider>{children}</FeatureFlagProvider>
        ),
      });

      expect(result.current.isEnabled('useShadcnUI')).toBe(false);

      act(() => {
        result.current.setFlag('useShadcnUI', true);
      });

      expect(result.current.isEnabled('useShadcnUI')).toBe(true);
    });

    it('should throw error when used outside provider', () => {
      // This test expects the hook to throw an error
      const consoleError = console.error;
      console.error = () => {
        // Suppress error output in test
      };

      expect(() => {
        renderHook(() => useFeatureFlag());
      }).toThrow('useFeatureFlag must be used within a FeatureFlagProvider');

      console.error = consoleError; // Restore console.error
    });
  });

  describe('localStorage persistence', () => {
    it('should persist feature flags to localStorage', () => {
      const { result } = renderHook(() => useFeatureFlag(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FeatureFlagProvider>{children}</FeatureFlagProvider>
        ),
      });

      act(() => {
        result.current.setFlag('useShadcnUI', true);
      });

      const stored = localStorage.getItem('featureFlags');
      expect(stored).toBeTruthy();
      if (stored) {
        const parsed = JSON.parse(stored) as { useShadcnUI: boolean };
        expect(parsed.useShadcnUI).toBe(true);
      }
    });

    it('should load feature flags from localStorage on mount', () => {
      localStorage.setItem('featureFlags', JSON.stringify({ useShadcnUI: true }));

      const { result } = renderHook(() => useFeatureFlag(), {
        wrapper: ({ children }: { children: ReactNode }) => (
          <FeatureFlagProvider>{children}</FeatureFlagProvider>
        ),
      });

      expect(result.current.flags.useShadcnUI).toBe(true);
    });
  });
});