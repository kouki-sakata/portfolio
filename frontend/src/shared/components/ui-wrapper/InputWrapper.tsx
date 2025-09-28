import { type ChangeEvent, type FocusEvent, type HTMLInputTypeAttribute } from 'react';

import { Input as ShadcnInput } from '@/components/ui/input';
import { Label as ShadcnLabel } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { useFeatureFlag } from '../../hooks/use-feature-flag';

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
  const { isEnabled } = useFeatureFlag();
  const useShadcn = isEnabled('useShadcnUI');

  const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const helpTextId = helpText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  const describedBy = [helpTextId, errorId].filter(Boolean).join(' ') || undefined;

  if (useShadcn) {
    // shadcn/ui implementation
    return (
      <div className="space-y-2">
        <ShadcnLabel htmlFor={inputId} className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </ShadcnLabel>

        <ShadcnInput
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
          className={cn(
            error && 'border-red-500 focus-visible:ring-red-500'
          )}
        />

        {helpText && (
          <div id={helpTextId} className="text-sm text-neutral-500">
            {helpText}
          </div>
        )}

        {error && (
          <div id={errorId} role="alert" className="text-sm text-red-500">
            {error}
          </div>
        )}
      </div>
    );
  }

  // Custom implementation (existing)
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