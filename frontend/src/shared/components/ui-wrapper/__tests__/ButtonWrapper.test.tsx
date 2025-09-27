import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ButtonWrapper, type ButtonWrapperProps } from '../ButtonWrapper'
import { FeatureFlagProvider } from '@/shared/lib/feature-flags'

describe('ButtonWrapper Component', () => {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  }

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Legacy Mode (Feature Flag OFF)', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue(null) // Flag is off
    })

    it('should render legacy button with correct class', () => {
      render(
        <FeatureFlagProvider>
          <ButtonWrapper>Click me</ButtonWrapper>
        </FeatureFlagProvider>
      )

      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('button')
    })

    it('should apply variant classes for legacy button', () => {
      const { rerender } = render(
        <FeatureFlagProvider>
          <ButtonWrapper variant="primary">Primary</ButtonWrapper>
        </FeatureFlagProvider>
      )

      let button = screen.getByRole('button')
      expect(button).toHaveClass('button')
      expect(button).toHaveClass('button--primary')

      rerender(
        <FeatureFlagProvider>
          <ButtonWrapper variant="secondary">Secondary</ButtonWrapper>
        </FeatureFlagProvider>
      )

      button = screen.getByRole('button')
      expect(button).toHaveClass('button')
      expect(button).toHaveClass('button--secondary')
    })

    it('should handle onClick event', async () => {
      const handleClick = vi.fn()
      render(
        <FeatureFlagProvider>
          <ButtonWrapper onClick={handleClick}>Click me</ButtonWrapper>
        </FeatureFlagProvider>
      )

      const button = screen.getByRole('button')
      await userEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should handle disabled state', () => {
      render(
        <FeatureFlagProvider>
          <ButtonWrapper disabled>Disabled</ButtonWrapper>
        </FeatureFlagProvider>
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('button--disabled')
    })

    it('should apply size classes', () => {
      const { rerender } = render(
        <FeatureFlagProvider>
          <ButtonWrapper size="small">Small</ButtonWrapper>
        </FeatureFlagProvider>
      )

      let button = screen.getByRole('button')
      expect(button).toHaveClass('button--small')

      rerender(
        <FeatureFlagProvider>
          <ButtonWrapper size="large">Large</ButtonWrapper>
        </FeatureFlagProvider>
      )

      button = screen.getByRole('button')
      expect(button).toHaveClass('button--large')
    })

    it('should merge custom className', () => {
      render(
        <FeatureFlagProvider>
          <ButtonWrapper className="custom-class">Custom</ButtonWrapper>
        </FeatureFlagProvider>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should forward other HTML button attributes', () => {
      render(
        <FeatureFlagProvider>
          <ButtonWrapper type="submit" aria-label="Submit form">
            Submit
          </ButtonWrapper>
        </FeatureFlagProvider>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('aria-label', 'Submit form')
    })
  })

  describe('shadcn/ui Mode (Feature Flag ON)', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('true') // Flag is on
    })

    it('should render shadcn/ui Button component', () => {
      render(
        <FeatureFlagProvider>
          <ButtonWrapper>Click me</ButtonWrapper>
        </FeatureFlagProvider>
      )

      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
      // shadcn/ui Button has specific classes
      expect(button).toHaveClass('inline-flex')
      expect(button).toHaveClass('items-center')
    })

    it('should map variants to shadcn/ui variants', () => {
      const { rerender } = render(
        <FeatureFlagProvider>
          <ButtonWrapper variant="primary">Primary</ButtonWrapper>
        </FeatureFlagProvider>
      )

      let button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary') // shadcn primary variant

      rerender(
        <FeatureFlagProvider>
          <ButtonWrapper variant="secondary">Secondary</ButtonWrapper>
        </FeatureFlagProvider>
      )

      button = screen.getByRole('button')
      expect(button).toHaveClass('bg-secondary') // shadcn secondary variant

      rerender(
        <FeatureFlagProvider>
          <ButtonWrapper variant="danger">Danger</ButtonWrapper>
        </FeatureFlagProvider>
      )

      button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive') // mapped to destructive
    })

    it('should map sizes to shadcn/ui sizes', () => {
      const { rerender } = render(
        <FeatureFlagProvider>
          <ButtonWrapper size="small">Small</ButtonWrapper>
        </FeatureFlagProvider>
      )

      let button = screen.getByRole('button')
      expect(button).toHaveClass('h-8') // shadcn sm size

      rerender(
        <FeatureFlagProvider>
          <ButtonWrapper size="large">Large</ButtonWrapper>
        </FeatureFlagProvider>
      )

      button = screen.getByRole('button')
      expect(button).toHaveClass('h-10') // shadcn lg size
    })

    it('should handle disabled state', () => {
      render(
        <FeatureFlagProvider>
          <ButtonWrapper disabled>Disabled</ButtonWrapper>
        </FeatureFlagProvider>
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:pointer-events-none')
    })

    it('should forward props correctly to shadcn Button', async () => {
      const handleClick = vi.fn()
      render(
        <FeatureFlagProvider>
          <ButtonWrapper onClick={handleClick} type="submit">
            Submit
          </ButtonWrapper>
        </FeatureFlagProvider>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'submit')

      await userEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Dynamic Feature Flag Toggle', () => {
    it('should switch between legacy and shadcn when flag changes', () => {
      // Initially legacy mode
      localStorageMock.getItem.mockReturnValue(null)

      const { rerender } = render(
        <FeatureFlagProvider>
          <ButtonWrapper>Toggle Test</ButtonWrapper>
        </FeatureFlagProvider>
      )

      let button = screen.getByRole('button')
      expect(button).toHaveClass('button')

      // Switch to shadcn mode by changing localStorage and re-mounting provider
      localStorageMock.getItem.mockReturnValue('true')

      // Force complete re-mount to pick up new localStorage values
      rerender(
        <FeatureFlagProvider key="remount">
          <ButtonWrapper>Toggle Test</ButtonWrapper>
        </FeatureFlagProvider>
      )

      button = screen.getByRole('button')
      expect(button).toHaveClass('inline-flex')
    })
  })

  describe('TypeScript Types', () => {
    it('should accept valid ButtonWrapperProps', () => {
      const validProps: ButtonWrapperProps = {
        variant: 'primary',
        size: 'medium',
        disabled: false,
        className: 'test',
        onClick: () => {},
        children: 'Test',
        type: 'button',
      }

      render(
        <FeatureFlagProvider>
          <ButtonWrapper {...validProps} />
        </FeatureFlagProvider>
      )

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle all variant types', () => {
      const variants: NonNullable<ButtonWrapperProps['variant']>[] = [
        'primary',
        'secondary',
        'danger',
        'ghost',
        'link',
      ]

      variants.forEach((variant) => {
        render(
          <FeatureFlagProvider>
            <ButtonWrapper variant={variant}>{variant}</ButtonWrapper>
          </FeatureFlagProvider>
        )
      })

      expect(screen.getAllByRole('button')).toHaveLength(variants.length)
    })

    it('should handle all size types', () => {
      const sizes: NonNullable<ButtonWrapperProps['size']>[] = ['small', 'medium', 'large']

      sizes.forEach((size) => {
        render(
          <FeatureFlagProvider>
            <ButtonWrapper size={size}>{size}</ButtonWrapper>
          </FeatureFlagProvider>
        )
      })

      expect(screen.getAllByRole('button')).toHaveLength(sizes.length)
    })
  })

  describe('asChild prop (for shadcn mode)', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('true') // shadcn mode
    })

    it('should support asChild prop in shadcn mode', () => {
      render(
        <FeatureFlagProvider>
          <ButtonWrapper asChild>
            <a href="/test">Link as Button</a>
          </ButtonWrapper>
        </FeatureFlagProvider>
      )

      const link = screen.getByRole('link', { name: /link as button/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
    })

    it('should ignore asChild in legacy mode', () => {
      localStorageMock.getItem.mockReturnValue(null) // legacy mode

      render(
        <FeatureFlagProvider>
          <ButtonWrapper asChild>
            <span>Should render as button</span>
          </ButtonWrapper>
        </FeatureFlagProvider>
      )

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button.tagName).toBe('BUTTON')
    })
  })
})