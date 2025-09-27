import React from 'react'

import { cn } from '@/lib/utils'
import { Button as ShadcnButton, type ButtonProps as ShadcnButtonProps } from '@/shared/components/ui/button'
import { FEATURE_FLAGS,useFeatureFlag } from '@/shared/lib/feature-flags'

// ButtonWrapper prop types
export interface ButtonWrapperProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'
  size?: 'small' | 'medium' | 'large'
  asChild?: boolean
  children?: React.ReactNode
}

// Map our variant names to shadcn/ui variant names
const mapVariantToShadcn = (variant?: ButtonWrapperProps['variant']): ShadcnButtonProps['variant'] => {
  switch (variant) {
    case 'primary':
      return 'default'
    case 'secondary':
      return 'secondary'
    case 'danger':
      return 'destructive'
    case 'ghost':
      return 'ghost'
    case 'link':
      return 'link'
    default:
      return 'default'
  }
}

// Map our size names to shadcn/ui size names
const mapSizeToShadcn = (size?: ButtonWrapperProps['size']): ShadcnButtonProps['size'] => {
  switch (size) {
    case 'small':
      return 'sm'
    case 'large':
      return 'lg'
    case 'medium':
    default:
      return 'default'
  }
}

export function ButtonWrapper({
  variant = 'primary',
  size = 'medium',
  className,
  children,
  disabled,
  asChild,
  ...props
}: ButtonWrapperProps) {
  const [useShadcn] = useFeatureFlag(FEATURE_FLAGS.USE_SHADCN_BUTTON)

  if (useShadcn) {
    // Use shadcn/ui Button component
    return (
      <ShadcnButton
        variant={mapVariantToShadcn(variant)}
        size={mapSizeToShadcn(size)}
        className={className}
        disabled={disabled}
        asChild={asChild ?? false}
        {...props}
      >
        {children}
      </ShadcnButton>
    )
  }

  // Use legacy button with class names
  const legacyClasses = cn(
    'button',
    `button--${variant}`,
    size !== 'medium' && `button--${size}`,
    disabled && 'button--disabled',
    className
  )

  // In legacy mode, ignore asChild prop and always render a button element
  return (
    <button
      className={legacyClasses}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}