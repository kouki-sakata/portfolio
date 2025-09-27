import { act, render, renderHook, screen } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FeatureFlagProvider, useFeatureFlag } from '../feature-flags'
import {
  FEATURE_FLAGS,
  getFeatureFlag,
  resetFeatureFlags,
  setFeatureFlag} from '../feature-flags-exports'

describe('Feature Flag System', () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  }

  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    // Clear mocks
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()

    // Reset environment variables
    vi.stubEnv('VITE_FEATURE_USE_SHADCN', '')
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  describe('Feature Flag Constants', () => {
    it('should define all required feature flags', () => {
      expect(FEATURE_FLAGS.USE_SHADCN_BUTTON).toBeDefined()
      expect(FEATURE_FLAGS.USE_SHADCN_CARD).toBeDefined()
      expect(FEATURE_FLAGS.USE_SHADCN_INPUT).toBeDefined()
    })
  })

  describe('getFeatureFlag', () => {
    it('should return default value when flag is not set', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const result = getFeatureFlag(FEATURE_FLAGS.USE_SHADCN_BUTTON)

      expect(result).toBe(false)
    })

    it('should return value from localStorage when set', () => {
      localStorageMock.getItem.mockReturnValue('true')

      const result = getFeatureFlag(FEATURE_FLAGS.USE_SHADCN_BUTTON)

      expect(result).toBe(true)
      expect(localStorageMock.getItem).toHaveBeenCalledWith('feature-flag:USE_SHADCN_BUTTON')
    })

    it('should prioritize environment variable over localStorage', () => {
      vi.stubEnv('VITE_FEATURE_USE_SHADCN_BUTTON', 'true')
      localStorageMock.getItem.mockReturnValue('false')

      const result = getFeatureFlag(FEATURE_FLAGS.USE_SHADCN_BUTTON)

      expect(result).toBe(true)
    })

    it('should handle invalid localStorage values gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid')

      const result = getFeatureFlag(FEATURE_FLAGS.USE_SHADCN_BUTTON)

      expect(result).toBe(false)
    })
  })

  describe('setFeatureFlag', () => {
    it('should save flag value to localStorage', () => {
      setFeatureFlag(FEATURE_FLAGS.USE_SHADCN_BUTTON, true)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'feature-flag:USE_SHADCN_BUTTON',
        'true'
      )
    })

    it('should save false flag value to localStorage', () => {
      setFeatureFlag(FEATURE_FLAGS.USE_SHADCN_BUTTON, false)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'feature-flag:USE_SHADCN_BUTTON',
        'false'
      )
    })

    it('should trigger event for cross-tab sync', () => {
      const storageListener = vi.fn()
      const customListener = vi.fn()
      window.addEventListener('storage', storageListener)
      window.addEventListener('feature-flag-change', customListener)

      setFeatureFlag(FEATURE_FLAGS.USE_SHADCN_BUTTON, true)

      // Verify either storage event or custom event is dispatched
      expect(storageListener.mock.calls.length + customListener.mock.calls.length).toBeGreaterThan(0)

      window.removeEventListener('storage', storageListener)
      window.removeEventListener('feature-flag-change', customListener)
    })
  })

  describe('resetFeatureFlags', () => {
    it('should clear all feature flags from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key.startsWith('feature-flag:')) return 'true'
        return null
      })

      // Mock localStorage.key to return feature flag keys
      localStorageMock.key.mockImplementation((index: number) => {
        const keys = ['feature-flag:USE_SHADCN_BUTTON', 'feature-flag:USE_SHADCN_CARD']
        return keys[index] ?? null
      })
      localStorageMock.length = 2

      resetFeatureFlags()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('feature-flag:USE_SHADCN_BUTTON')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('feature-flag:USE_SHADCN_CARD')
    })
  })

  describe('useFeatureFlag Hook', () => {
    it('should return current flag value', () => {
      localStorageMock.getItem.mockReturnValue('true')

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FeatureFlagProvider>{children}</FeatureFlagProvider>
      )

      const { result } = renderHook(
        () => useFeatureFlag(FEATURE_FLAGS.USE_SHADCN_BUTTON),
        { wrapper }
      )

      expect(result.current[0]).toBe(true)
    })

    it('should provide setter function to update flag', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FeatureFlagProvider>{children}</FeatureFlagProvider>
      )

      const { result } = renderHook(
        () => useFeatureFlag(FEATURE_FLAGS.USE_SHADCN_BUTTON),
        { wrapper }
      )

      act(() => {
        result.current[1](true)
      })

      expect(result.current[0]).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should sync across multiple hook instances', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FeatureFlagProvider>{children}</FeatureFlagProvider>
      )

      const { result: result1 } = renderHook(
        () => useFeatureFlag(FEATURE_FLAGS.USE_SHADCN_BUTTON),
        { wrapper }
      )

      const { result: result2 } = renderHook(
        () => useFeatureFlag(FEATURE_FLAGS.USE_SHADCN_BUTTON),
        { wrapper }
      )

      act(() => {
        result1.current[1](true)
      })

      expect(result1.current[0]).toBe(true)
      expect(result2.current[0]).toBe(true)
    })

    it('should handle storage events for cross-tab sync', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <FeatureFlagProvider>{children}</FeatureFlagProvider>
      )

      const { result } = renderHook(
        () => useFeatureFlag(FEATURE_FLAGS.USE_SHADCN_BUTTON),
        { wrapper }
      )

      // Simulate storage event from another tab
      act(() => {
        const event = new StorageEvent('storage', {
          key: 'feature-flag:USE_SHADCN_BUTTON',
          newValue: 'true',
        })
        window.dispatchEvent(event)
      })

      expect(result.current[0]).toBe(true)
    })
  })

  describe('FeatureFlagProvider', () => {
    it('should provide feature flag context to children', () => {
      // Ensure localStorage returns null for this test
      localStorageMock.getItem.mockReturnValue(null)

      const TestComponent = () => {
        const [isEnabled] = useFeatureFlag(FEATURE_FLAGS.USE_SHADCN_BUTTON)
        return <div>{isEnabled ? 'Enabled' : 'Disabled'}</div>
      }

      render(
        <FeatureFlagProvider>
          <TestComponent />
        </FeatureFlagProvider>
      )

      expect(screen.getByText('Disabled')).toBeInTheDocument()
    })

    it('should initialize with environment variables', () => {
      vi.stubEnv('VITE_FEATURE_USE_SHADCN_BUTTON', 'true')

      const TestComponent = () => {
        const [isEnabled] = useFeatureFlag(FEATURE_FLAGS.USE_SHADCN_BUTTON)
        return <div>{isEnabled ? 'Enabled' : 'Disabled'}</div>
      }

      render(
        <FeatureFlagProvider>
          <TestComponent />
        </FeatureFlagProvider>
      )

      expect(screen.getByText('Enabled')).toBeInTheDocument()
    })

    it('should throw error when useFeatureFlag is used outside provider', () => {
      // Suppress console.error for this test
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Intentionally empty to suppress error output
      })

      expect(() => {
        renderHook(() => useFeatureFlag(FEATURE_FLAGS.USE_SHADCN_BUTTON))
      }).toThrow('useFeatureFlag must be used within a FeatureFlagProvider')

      spy.mockRestore()
    })
  })

  describe('Feature Flag Types', () => {
    it('should have proper TypeScript type definitions', () => {
      // This test verifies that TypeScript types are correctly defined
      // The actual type checking is done by TypeScript compiler

      type FlagName = keyof typeof FEATURE_FLAGS
      const validFlag: FlagName = 'USE_SHADCN_BUTTON'

      expect(FEATURE_FLAGS[validFlag]).toBe('USE_SHADCN_BUTTON')
    })
  })
})