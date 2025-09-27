import React from 'react'
import { cn } from '@/lib/utils'
import { Input as ShadcnInput } from '@/shared/components/ui/input'
import { useFeatureFlag, FEATURE_FLAGS } from '@/shared/lib/feature-flags'

// InputWrapper prop types
export interface InputWrapperProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'size'> {
  variant?: 'default' | 'error' | 'success'
  inputSize?: 'small' | 'medium' | 'large'
  type?: React.InputHTMLAttributes<HTMLInputElement>['type'] | 'textarea'
}

// Map size to shadcn classes
const mapSizeToShadcn = (inputSize?: InputWrapperProps['inputSize']): string => {
  switch (inputSize) {
    case 'small':
      return 'h-8'
    case 'large':
      return 'h-11'
    case 'medium':
    default:
      return 'h-9'
  }
}

// Map variant to shadcn classes
const mapVariantToShadcn = (variant?: InputWrapperProps['variant']): string => {
  switch (variant) {
    case 'error':
      return 'border-destructive focus-visible:ring-destructive'
    case 'success':
      return 'border-green-500 focus-visible:ring-green-500'
    case 'default':
    default:
      return ''
  }
}

export function InputWrapper({
  variant = 'default',
  inputSize = 'medium',
  type = 'text',
  className,
  disabled,
  ...props
}: InputWrapperProps) {
  const [useShadcn] = useFeatureFlag(FEATURE_FLAGS.USE_SHADCN_INPUT)

  if (useShadcn) {
    // Use shadcn/ui Input component
    if (type === 'textarea') {
      // Render as textarea in shadcn mode
      const textareaClasses = cn(
        'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none',
        mapVariantToShadcn(variant),
        mapSizeToShadcn(inputSize),
        className
      )

      return (
        <textarea
          className={textareaClasses}
          disabled={disabled}
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      )
    }

    // Regular input in shadcn mode
    const inputClasses = cn(
      mapSizeToShadcn(inputSize),
      mapVariantToShadcn(variant)
    )

    return (
      <ShadcnInput
        type={type as React.InputHTMLAttributes<HTMLInputElement>['type']}
        className={cn(inputClasses, className)}
        disabled={disabled}
        {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
      />
    )
  }

  // Use legacy input with class names
  const legacyClasses = cn(
    'input',
    type === 'textarea' && 'input--textarea',
    variant && variant !== 'default' && `input--${variant}`,
    inputSize && inputSize !== 'medium' && `input--${inputSize}`,
    disabled && 'input--disabled',
    className
  )

  // Render textarea or input based on type
  if (type === 'textarea') {
    return (
      <textarea
        className={legacyClasses}
        disabled={disabled}
        {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    )
  }

  return (
    <input
      type={type as React.InputHTMLAttributes<HTMLInputElement>['type']}
      className={legacyClasses}
      disabled={disabled}
      {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
    />
  )
}