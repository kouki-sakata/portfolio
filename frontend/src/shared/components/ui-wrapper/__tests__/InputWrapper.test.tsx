import { fireEvent,render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { InputWrapper } from '../InputWrapper';

describe('InputWrapper', () => {
  it('should render input correctly', () => {
    render(
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

    render(
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

    render(
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
    render(
      <InputWrapper
        label="Test Input"
        isValid={true}
        data-testid="test-input"
      />
    );

    // Fixed: Use Testing Library methods instead of container queries
    const input = screen.getByLabelText('Test Input');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('should handle focus and blur events', () => {
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();

    render(
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
    render(
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
    render(
      <InputWrapper
        label="Test Input"
        required={true}
        data-testid="test-input"
      />
    );

    // Fixed: Use getByRole since label contains nested span element
    const input = screen.getByRole('textbox', { name: /test input/i });
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('should render with help text', () => {
    const helpText = 'Please enter your full name';

    render(
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