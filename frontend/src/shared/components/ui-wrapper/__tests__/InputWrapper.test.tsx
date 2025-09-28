import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { InputWrapper } from '../InputWrapper';
import { FeatureFlagProvider } from '../../../contexts/FeatureFlagContext';

describe('InputWrapper', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('with feature flag disabled (custom implementation)', () => {
    const renderWithProvider = (ui: React.ReactElement) => {
      return render(
        <FeatureFlagProvider initialFlags={{ useShadcnUI: false }}>
          {ui}
        </FeatureFlagProvider>
      );
    };

    it('should render input correctly', () => {
      renderWithProvider(
        <InputWrapper
          label="Test Label"
          placeholder="Enter text"
          data-testid="test-input"
        />
      );

      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should handle input changes', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      renderWithProvider(
        <InputWrapper
          label="Test Input"
          onChange={handleChange}
          data-testid="test-input"
        />
      );

      const input = screen.getByLabelText('Test Input');
      await user.type(input, 'test value');

      expect(handleChange).toHaveBeenCalled();
    });

    it('should display error message', () => {
      const errorMessage = 'This field is required';

      renderWithProvider(
        <InputWrapper
          label="Test Input"
          error={errorMessage}
          data-testid="test-input"
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should show validation state', () => {
      renderWithProvider(
        <InputWrapper
          label="Test Input"
          isValid={true}
          data-testid="test-input"
        />
      );

      const input = screen.getByLabelText('Test Input');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should handle focus and blur events', () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();

      renderWithProvider(
        <InputWrapper
          label="Test Input"
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-testid="test-input"
        />
      );

      const input = screen.getByLabelText('Test Input');

      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);

      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
      renderWithProvider(
        <InputWrapper
          label="Test Input"
          disabled={true}
          data-testid="test-input"
        />
      );

      const input = screen.getByLabelText('Test Input');
      expect(input).toBeDisabled();
    });

    it('should have correct accessibility attributes', () => {
      renderWithProvider(
        <InputWrapper
          label="Test Input"
          required={true}
          data-testid="test-input"
        />
      );

      const input = screen.getByRole('textbox', { name: /test input/i });
      expect(input).toHaveAttribute('required');
      expect(input).toHaveAttribute('aria-required', 'true');
    });

    it('should render with help text', () => {
      const helpText = 'Please enter your full name';

      renderWithProvider(
        <InputWrapper
          label="Full Name"
          helpText={helpText}
          data-testid="test-input"
        />
      );

      expect(screen.getByText(helpText)).toBeInTheDocument();

      const input = screen.getByLabelText('Full Name');
      const helpTextElement = screen.getByText(helpText);
      expect(input).toHaveAttribute('aria-describedby', helpTextElement.id);
    });
  });

  describe('with feature flag enabled (shadcn/ui implementation)', () => {
    const renderWithProvider = (ui: React.ReactElement) => {
      return render(
        <FeatureFlagProvider initialFlags={{ useShadcnUI: true }}>
          {ui}
        </FeatureFlagProvider>
      );
    };

    it('should render shadcn/ui input with label', () => {
      renderWithProvider(
        <InputWrapper
          label="Test Label"
          placeholder="Enter text"
          data-testid="test-input"
        />
      );

      expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();

      // shadcn/ui input should have specific classes
      const input = screen.getByLabelText('Test Label');
      expect(input.className).toContain('flex');
      expect(input.className).toContain('h-9');
      expect(input.className).toContain('w-full');
    });

    it('should handle input changes with shadcn/ui', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      renderWithProvider(
        <InputWrapper
          label="Test Input"
          onChange={handleChange}
          data-testid="test-input"
        />
      );

      const input = screen.getByLabelText('Test Input');
      await user.type(input, 'test value');

      expect(handleChange).toHaveBeenCalled();
    });

    it('should display error message with shadcn/ui styling', () => {
      const errorMessage = 'This field is required';

      renderWithProvider(
        <InputWrapper
          label="Test Input"
          error={errorMessage}
          data-testid="test-input"
        />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();

      // Error message should have appropriate styling
      const errorElement = screen.getByRole('alert');
      expect(errorElement.className).toContain('text-sm');
      expect(errorElement.className).toContain('text-red-500');
    });

    it('should show validation state with shadcn/ui', () => {
      renderWithProvider(
        <InputWrapper
          label="Test Input"
          isValid={false}
          error="Invalid input"
          data-testid="test-input"
        />
      );

      const input = screen.getByLabelText('Test Input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      // Input should have error styling
      expect(input.className).toContain('border-red-500');
    });

    it('should apply shadcn/ui label styling', () => {
      renderWithProvider(
        <InputWrapper
          label="Test Label"
          required={true}
          data-testid="test-input"
        />
      );

      const label = screen.getByText(/Test Label/);
      // shadcn/ui Label component should have specific styling
      expect(label.className).toContain('text-sm');
      expect(label.className).toContain('font-medium');
    });

    it('should render help text with shadcn/ui styling', () => {
      const helpText = 'Please enter your full name';

      renderWithProvider(
        <InputWrapper
          label="Full Name"
          helpText={helpText}
          data-testid="test-input"
        />
      );

      const helpElement = screen.getByText(helpText);
      expect(helpElement).toBeInTheDocument();
      expect(helpElement.className).toContain('text-sm');
      expect(helpElement.className).toContain('text-neutral-500');
    });

    it('should handle different input types', () => {
      renderWithProvider(
        <InputWrapper
          label="Email"
          type="email"
          placeholder="user@example.com"
          data-testid="email-input"
        />
      );

      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('type', 'email');
    });
  });

  describe('feature flag behavior', () => {
    it('should use custom implementation when flag is false', () => {
      render(
        <FeatureFlagProvider initialFlags={{ useShadcnUI: false }}>
          <InputWrapper label="Test Input" />
        </FeatureFlagProvider>
      );

      const input = screen.getByLabelText('Test Input');
      // Custom implementation - no flex class
      expect(input.className).not.toContain('flex');
    });

    it('should use shadcn/ui implementation when flag is true', () => {
      render(
        <FeatureFlagProvider initialFlags={{ useShadcnUI: true }}>
          <InputWrapper label="Test Input" />
        </FeatureFlagProvider>
      );

      const input = screen.getByLabelText('Test Input');
      // shadcn/ui implementation - has flex class
      expect(input.className).toContain('flex');
    });
  });
});