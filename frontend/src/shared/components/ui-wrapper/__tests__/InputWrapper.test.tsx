import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FeatureFlagProvider } from '@/shared/lib/feature-flags'

import { InputWrapper, type InputWrapperProps } from '../InputWrapper'

describe('InputWrapper Component', () => {
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

    it('should render legacy input with correct class', () => {
      render(
        <FeatureFlagProvider>
          <InputWrapper placeholder="Enter text" />
        </FeatureFlagProvider>
      )

      const input = screen.getByPlaceholderText('Enter text')
      expect(input).toBeInTheDocument()
      expect(input).toHaveClass('input')
    })

    it('should apply variant classes for legacy input', () => {
      const { rerender } = render(
        <FeatureFlagProvider>
          <InputWrapper variant="default" />
        </FeatureFlagProvider>
      )

      let input = screen.getByRole('textbox')
      expect(input).toHaveClass('input')

      rerender(
        <FeatureFlagProvider>
          <InputWrapper variant="error" />
        </FeatureFlagProvider>
      )

      input = screen.getByRole('textbox')
      expect(input).toHaveClass('input--error')
    })

    it('should handle different input types', () => {
      const { rerender } = render(
        <FeatureFlagProvider>
          <InputWrapper type="email" placeholder="Email" />
        </FeatureFlagProvider>
      )

      let input = screen.getByPlaceholderText('Email')
      expect(input.type).toBe('email')

      rerender(
        <FeatureFlagProvider>
          <InputWrapper type="password" placeholder="Password" />
        </FeatureFlagProvider>
      )

      input = screen.getByPlaceholderText('Password')
      expect(input.type).toBe('password')

      rerender(
        <FeatureFlagProvider>
          <InputWrapper type="number" placeholder="Number" />
        </FeatureFlagProvider>
      )

      input = screen.getByPlaceholderText('Number')
      expect(input.type).toBe('number')
    })

    it('should handle onChange event', async () => {
      const handleChange = vi.fn()
      render(
        <FeatureFlagProvider>
          <InputWrapper onChange={handleChange} />
        </FeatureFlagProvider>
      )

      const input = screen.getByRole('textbox')
      await userEvent.type(input, 'test')

      expect(handleChange).toHaveBeenCalled()
    })

    it('should handle disabled state', () => {
      render(
        <FeatureFlagProvider>
          <InputWrapper disabled placeholder="Disabled input" />
        </FeatureFlagProvider>
      )

      const input = screen.getByPlaceholderText('Disabled input')
      expect(input).toBeDisabled()
      expect(input).toHaveClass('input--disabled')
    })

    it('should apply size classes', () => {
      const { rerender } = render(
        <FeatureFlagProvider>
          <InputWrapper inputSize="small" />
        </FeatureFlagProvider>
      )

      let input = screen.getByRole('textbox')
      expect(input).toHaveClass('input--small')

      rerender(
        <FeatureFlagProvider>
          <InputWrapper inputSize="large" />
        </FeatureFlagProvider>
      )

      input = screen.getByRole('textbox')
      expect(input).toHaveClass('input--large')
    })

    it('should handle value prop', () => {
      render(
        <FeatureFlagProvider>
          <InputWrapper value="Initial value" readOnly />
        </FeatureFlagProvider>
      )

      const input = screen.getByRole('textbox')
      expect(input.value).toBe('Initial value')
    })

    it('should merge custom className', () => {
      render(
        <FeatureFlagProvider>
          <InputWrapper className="custom-input-class" />
        </FeatureFlagProvider>
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('input')
      expect(input).toHaveClass('custom-input-class')
    })

    it('should forward other HTML input attributes', () => {
      render(
        <FeatureFlagProvider>
          <InputWrapper
            name="username"
            id="username-input"
            required
            autoComplete="username"
            maxLength={50}
          />
        </FeatureFlagProvider>
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('name', 'username')
      expect(input).toHaveAttribute('id', 'username-input')
      expect(input).toHaveAttribute('required')
      expect(input).toHaveAttribute('autocomplete', 'username')
      expect(input).toHaveAttribute('maxlength', '50')
    })
  })

  describe('shadcn/ui Mode (Feature Flag ON)', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('true') // Flag is on
    })

    it('should render shadcn/ui Input component', () => {
      render(
        <FeatureFlagProvider>
          <InputWrapper placeholder="Enter text" />
        </FeatureFlagProvider>
      )

      const input = screen.getByPlaceholderText('Enter text')
      expect(input).toBeInTheDocument()
      // shadcn/ui Input has specific classes
      expect(input).toHaveClass('flex')
      expect(input).toHaveClass('h-9')
      expect(input).toHaveClass('rounded-md')
      expect(input).toHaveClass('border')
    })

    it('should handle error variant in shadcn mode', () => {
      render(
        <FeatureFlagProvider>
          <InputWrapper variant="error" />
        </FeatureFlagProvider>
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('border-destructive')
      expect(input).toHaveClass('focus-visible:ring-destructive')
    })

    it('should handle sizes in shadcn mode', () => {
      const { rerender } = render(
        <FeatureFlagProvider>
          <InputWrapper inputSize="small" />
        </FeatureFlagProvider>
      )

      let input = screen.getByRole('textbox')
      expect(input).toHaveClass('h-8') // small height

      rerender(
        <FeatureFlagProvider>
          <InputWrapper inputSize="large" />
        </FeatureFlagProvider>
      )

      input = screen.getByRole('textbox')
      expect(input).toHaveClass('h-11') // large height
    })

    it('should handle disabled state in shadcn mode', () => {
      render(
        <FeatureFlagProvider>
          <InputWrapper disabled />
        </FeatureFlagProvider>
      )

      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
      expect(input).toHaveClass('disabled:cursor-not-allowed')
      expect(input).toHaveClass('disabled:opacity-50')
    })

    it('should forward props correctly to shadcn Input', async () => {
      const handleChange = vi.fn()
      const handleFocus = vi.fn()
      const handleBlur = vi.fn()

      render(
        <FeatureFlagProvider>
          <InputWrapper
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            type="email"
            name="email"
          />
        </FeatureFlagProvider>
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
      expect(input).toHaveAttribute('name', 'email')

      await userEvent.type(input, 'test')
      expect(handleChange).toHaveBeenCalled()

      await userEvent.click(input)
      expect(handleFocus).toHaveBeenCalled()

      await userEvent.tab()
      expect(handleBlur).toHaveBeenCalled()
    })
  })

  describe('Special Input Types', () => {
    it('should handle textarea type in legacy mode', () => {
      localStorageMock.getItem.mockReturnValue(null)

      render(
        <FeatureFlagProvider>
          <InputWrapper type="textarea" placeholder="Enter message" />
        </FeatureFlagProvider>
      )

      const textarea = screen.getByPlaceholderText('Enter message')
      expect(textarea.tagName).toBe('TEXTAREA')
      expect(textarea).toHaveClass('input')
      expect(textarea).toHaveClass('input--textarea')
    })

    it('should handle textarea type in shadcn mode', () => {
      localStorageMock.getItem.mockReturnValue('true')

      render(
        <FeatureFlagProvider>
          <InputWrapper type="textarea" placeholder="Enter message" />
        </FeatureFlagProvider>
      )

      const textarea = screen.getByPlaceholderText('Enter message')
      expect(textarea.tagName).toBe('TEXTAREA')
      expect(textarea).toHaveClass('min-h-[60px]')
      expect(textarea).toHaveClass('resize-none')
    })

    it('should handle file input type', () => {
      render(
        <FeatureFlagProvider>
          <InputWrapper type="file" />
        </FeatureFlagProvider>
      )

      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
      expect(fileInput?.getAttribute('type')).toBe('file')
    })
  })

  describe('Dynamic Feature Flag Toggle', () => {
    it('should switch between legacy and shadcn when flag changes', () => {
      // Initially legacy mode
      localStorageMock.getItem.mockReturnValue(null)

      const { rerender } = render(
        <FeatureFlagProvider>
          <InputWrapper placeholder="Toggle Test" />
        </FeatureFlagProvider>
      )

      let input = screen.getByPlaceholderText('Toggle Test')
      expect(input).toHaveClass('input')

      // Switch to shadcn mode
      localStorageMock.getItem.mockReturnValue('true')

      // Force complete re-mount to pick up new localStorage values
      rerender(
        <FeatureFlagProvider key="remount">
          <InputWrapper placeholder="Toggle Test" />
        </FeatureFlagProvider>
      )

      input = screen.getByPlaceholderText('Toggle Test')
      expect(input).toHaveClass('flex')
      expect(input).toHaveClass('h-9')
    })
  })

  describe('TypeScript Types', () => {
    it('should accept valid InputWrapperProps', () => {
      const validProps: InputWrapperProps = {
        type: 'text',
        variant: 'default',
        inputSize: 'medium',
        disabled: false,
        value: 'test',
        placeholder: 'Enter text',
        className: 'test',
        onChange: () => {},
        onBlur: () => {},
        onFocus: () => {},
      }

      render(
        <FeatureFlagProvider>
          <InputWrapper {...validProps} />
        </FeatureFlagProvider>
      )

      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('should handle all variant types', () => {
      const variants: NonNullable<InputWrapperProps['variant']>[] = ['default', 'error', 'success']

      variants.forEach((variant) => {
        render(
          <FeatureFlagProvider>
            <InputWrapper variant={variant} placeholder={variant} />
          </FeatureFlagProvider>
        )
      })

      expect(screen.getByPlaceholderText('default')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('error')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('success')).toBeInTheDocument()
    })

    it('should handle all size types', () => {
      const sizes: NonNullable<InputWrapperProps['inputSize']>[] = ['small', 'medium', 'large']

      sizes.forEach((inputSize) => {
        render(
          <FeatureFlagProvider>
            <InputWrapper inputSize={inputSize} placeholder={inputSize} />
          </FeatureFlagProvider>
        )
      })

      expect(screen.getByPlaceholderText('small')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('medium')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('large')).toBeInTheDocument()
    })
  })

  describe('Validation and Error Handling', () => {
    it('should display error styling when variant is error', () => {
      // Ensure legacy mode from the start
      localStorageMock.getItem.mockReturnValue(null)

      const { rerender } = render(
        <FeatureFlagProvider>
          <InputWrapper variant="default" />
        </FeatureFlagProvider>
      )

      let input = screen.getByRole('textbox')
      expect(input).not.toHaveClass('input--error')

      rerender(
        <FeatureFlagProvider>
          <InputWrapper variant="error" />
        </FeatureFlagProvider>
      )

      input = screen.getByRole('textbox')
      expect(input).toHaveClass('input--error')
    })

    it('should handle success variant', () => {
      localStorageMock.getItem.mockReturnValue(null) // legacy mode

      render(
        <FeatureFlagProvider>
          <InputWrapper variant="success" />
        </FeatureFlagProvider>
      )

      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('input--success')
    })
  })
})