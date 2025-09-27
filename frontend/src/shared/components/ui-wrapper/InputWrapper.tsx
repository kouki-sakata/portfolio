import { type ChangeEvent, type FocusEvent, type HTMLInputTypeAttribute } from 'react';

interface InputWrapperProps {
  label: string;
  placeholder?: string;
  value?: string;
  type?: HTMLInputTypeAttribute;
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  isValid?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  'data-testid'?: string;
}

export const InputWrapper = ({
  label,
  placeholder,
  value,
  type = 'text',
  error,
  helpText,
  required,
  disabled,
  isValid,
  onChange,
  onFocus,
  onBlur,
  'data-testid': dataTestId,
}: InputWrapperProps) => {
  const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const helpTextId = helpText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  const describedBy = [helpTextId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div>
      <label htmlFor={inputId}>
        {label}
        {required && <span aria-label="required">*</span>}
      </label>
      
      <input
        id={inputId}
        type={type}
        placeholder={placeholder}
        value={value}
        required={required}
        disabled={disabled}
        aria-required={required}
        aria-invalid={isValid === false || !!error}
        aria-describedby={describedBy}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        data-testid={dataTestId}
      />
      
      {helpText && (
        <div id={helpTextId}>
          {helpText}
        </div>
      )}
      
      {error && (
        <div id={errorId} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};