import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider, useTheme } from '../theme-provider'

describe('ThemeProvider', () => {
  // Mock localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn(),
    removeItem: vi.fn(),
    length: 0,
    key: vi.fn(),
  }

  // Mock matchMedia
  const matchMediaMock = vi.fn()

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })

    Object.defineProperty(window, 'matchMedia', {
      value: matchMediaMock,
      writable: true,
    })

    // Default matchMedia behavior (light mode)
    matchMediaMock.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    // Clear document classes
    document.documentElement.className = ''

    // Clear mocks
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('ThemeProvider Component', () => {
    it('should render children', () => {
      render(
        <ThemeProvider>
          <div>Test Content</div>
        </ThemeProvider>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should provide theme context to children', () => {
      const TestComponent = () => {
        const { theme } = useTheme()
        return <div>Current theme: {theme}</div>
      }

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByText(/Current theme:/)).toBeInTheDocument()
    })

    it('should use default theme when no localStorage value', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const TestComponent = () => {
        const { theme } = useTheme()
        return <div>Theme: {theme}</div>
      }

      render(
        <ThemeProvider defaultTheme="light" storageKey="test-no-value">
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByText('Theme: light')).toBeInTheDocument()
    })

    it('should use system as default theme when not specified', () => {
      localStorageMock.getItem.mockReturnValue(null)

      const TestComponent = () => {
        const { theme } = useTheme()
        return <div>Theme: {theme}</div>
      }

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      )

      expect(screen.getByText('Theme: system')).toBeInTheDocument()
    })

    it('should load theme from localStorage on mount', () => {
      localStorageMock.getItem.mockReturnValue('dark')

      const TestComponent = () => {
        const { theme } = useTheme()
        return <div>Theme: {theme}</div>
      }

      render(
        <ThemeProvider storageKey="test-theme">
          <TestComponent />
        </ThemeProvider>
      )

      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-theme')
      expect(screen.getByText('Theme: dark')).toBeInTheDocument()
    })

    it('should use custom storage key', () => {
      localStorageMock.getItem.mockReturnValue('light')

      render(
        <ThemeProvider storageKey="custom-theme-key">
          <div>Content</div>
        </ThemeProvider>
      )

      expect(localStorageMock.getItem).toHaveBeenCalledWith('custom-theme-key')
    })
  })

  describe('useTheme Hook', () => {
    it.skip('should throw error when used outside ThemeProvider', () => {
      // Suppress console.error for this test
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {
        // Intentionally empty to suppress error output
      })

      expect(() => {
        renderHook(() => useTheme())
      }).toThrow('useTheme must be used within a ThemeProvider')

      spy.mockRestore()
    })

    it('should return theme and setTheme function', () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      })

      expect(result.current).toHaveProperty('theme')
      expect(result.current).toHaveProperty('setTheme')
      expect(typeof result.current.setTheme).toBe('function')
    })

    it('should update theme when setTheme is called', async () => {
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <ThemeProvider defaultTheme="system">{children}</ThemeProvider>
        ),
      })

      expect(result.current.theme).toBe('system')

      act(() => {
        result.current.setTheme('dark')
      })

      await waitFor(() => {
        expect(result.current.theme).toBe('dark')
      })
    })

    it('should persist theme to localStorage when changed', async () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ({ children }) => (
          <ThemeProvider storageKey="test-theme">{children}</ThemeProvider>
        ),
      })

      act(() => {
        result.current.setTheme('dark')
      })

      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith('test-theme', 'dark')
      })
    })
  })

  describe('Theme Application', () => {
    it('should add light class to document root for light theme', () => {
      render(
        <ThemeProvider defaultTheme="light">
          <div>Content</div>
        </ThemeProvider>
      )

      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it('should add dark class to document root for dark theme', () => {
      localStorageMock.getItem.mockReturnValue('dark')

      render(
        <ThemeProvider defaultTheme="dark">
          <div>Content</div>
        </ThemeProvider>
      )

      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })

    it('should apply system theme based on prefers-color-scheme', () => {
      // Mock dark mode preference
      matchMediaMock.mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      render(
        <ThemeProvider defaultTheme="system">
          <div>Content</div>
        </ThemeProvider>
      )

      expect(document.documentElement.classList.contains('dark')).toBe(true)
      expect(document.documentElement.classList.contains('light')).toBe(false)
    })

    it.skip('should apply light theme when system prefers light', () => {
      // Mock light mode preference
      matchMediaMock.mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))

      render(
        <ThemeProvider defaultTheme="system">
          <div>Content</div>
        </ThemeProvider>
      )

      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })

    it.skip('should remove previous theme class when theme changes', async () => {
      const TestComponent = () => {
        const { theme, setTheme } = useTheme()
        return (
          <div>
            <span>Theme: {theme}</span>
            <button onClick={() => { setTheme('dark'); }}>Set Dark</button>
            <button onClick={() => { setTheme('light'); }}>Set Light</button>
          </div>
        )
      }

      render(
        <ThemeProvider defaultTheme="light">
          <TestComponent />
        </ThemeProvider>
      )

      expect(document.documentElement.classList.contains('light')).toBe(true)
      expect(document.documentElement.classList.contains('dark')).toBe(false)

      // Change to dark theme
      const darkButton = screen.getByRole('button', { name: /set dark/i })
      await userEvent.click(darkButton)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })
      expect(document.documentElement.classList.contains('light')).toBe(false)

      // Change back to light theme
      const lightButton = screen.getByRole('button', { name: /set light/i })
      await userEvent.click(lightButton)

      await waitFor(() => {
        expect(document.documentElement.classList.contains('light')).toBe(true)
      })
      expect(document.documentElement.classList.contains('dark')).toBe(false)
    })
  })

  describe('Theme Toggle Component', () => {
    it.skip('should provide a working theme toggle', async () => {
      const ThemeToggle = () => {
        const { theme, setTheme } = useTheme()

        return (
          <button
            onClick={() => {
              if (theme === 'light') setTheme('dark')
              else if (theme === 'dark') setTheme('system')
              else setTheme('light')
            }}
          >
            Toggle Theme: {theme}
          </button>
        )
      }

      render(
        <ThemeProvider defaultTheme="light">
          <ThemeToggle />
        </ThemeProvider>
      )

      const button = screen.getByRole('button')

      // Initial state
      expect(button).toHaveTextContent('Toggle Theme: light')

      // Click to change to dark
      await userEvent.click(button)
      await waitFor(() => {
        expect(button).toHaveTextContent('Toggle Theme: dark')
        expect(document.documentElement.classList.contains('dark')).toBe(true)
      })

      // Click to change to system
      await userEvent.click(button)
      await waitFor(() => {
        expect(button).toHaveTextContent('Toggle Theme: system')
      })

      // Click to change back to light
      await userEvent.click(button)
      await waitFor(() => {
        expect(button).toHaveTextContent('Toggle Theme: light')
        expect(document.documentElement.classList.contains('light')).toBe(true)
      })
    })
  })
})