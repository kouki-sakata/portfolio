import type { ChangeEvent, FocusEvent, HTMLInputTypeAttribute } from "react";

import { Input as ShadcnInput } from "@/components/ui/input";
import { Label as ShadcnLabel } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { useFeatureFlag } from "../../hooks/use-feature-flag";

type InputWrapperProps = {
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
  "data-testid"?: string;
};

export const InputWrapper = ({
  label,
  placeholder,
  value,
  type = "text",
  error,
  helpText,
  required,
  disabled,
  isValid,
  onChange,
  onFocus,
  onBlur,
  "data-testid": dataTestId,
}: InputWrapperProps) => {
  const { isEnabled } = useFeatureFlag();
  const useShadcn = isEnabled("useShadcnUI");

  const inputId = `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
  const helpTextId = helpText ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  const describedBy =
    [helpTextId, errorId].filter(Boolean).join(" ") || undefined;

  if (useShadcn) {
    // shadcn/ui implementation
    return (
      <div className="space-y-2">
        <ShadcnLabel className="font-medium text-sm" htmlFor={inputId}>
          {label}
          {required && (
            <span aria-label="required" className="ml-1 text-red-500">
              *
            </span>
          )}
        </ShadcnLabel>

        <ShadcnInput
          aria-describedby={describedBy}
          aria-invalid={isValid === false || !!error}
          aria-required={required}
          className={cn(error && "border-red-500 focus-visible:ring-red-500")}
          data-testid={dataTestId}
          disabled={disabled}
          id={inputId}
          onBlur={onBlur}
          onChange={onChange}
          onFocus={onFocus}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
        />

        {helpText && (
          <div className="text-neutral-500 text-sm" id={helpTextId}>
            {helpText}
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm" id={errorId} role="alert">
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
        aria-describedby={describedBy}
        aria-invalid={isValid === false || !!error}
        aria-required={required}
        data-testid={dataTestId}
        disabled={disabled}
        id={inputId}
        onBlur={onBlur}
        onChange={onChange}
        onFocus={onFocus}
        placeholder={placeholder}
        required={required}
        type={type}
        value={value}
      />

      {helpText && <div id={helpTextId}>{helpText}</div>}

      {error && (
        <div id={errorId} role="alert">
          {error}
        </div>
      )}
    </div>
  );
};
