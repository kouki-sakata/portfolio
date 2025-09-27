import React from 'react'

import { cn } from '@/lib/utils'
import {
  Card as ShadcnCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { useFeatureFlag } from '@/shared/lib/feature-flags'
import { FEATURE_FLAGS } from '@/shared/lib/feature-flags-exports'

// CardWrapper prop types
export interface CardWrapperProps {
  header?: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  variant?: 'default' | 'outlined' | 'elevated'
  padding?: 'none' | 'small' | 'medium' | 'large'
  className?: string
  children?: React.ReactNode
}

// Map padding sizes to Tailwind classes for shadcn mode
const mapPaddingToShadcn = (padding?: CardWrapperProps['padding']): string => {
  switch (padding) {
    case 'none':
      return 'p-0'
    case 'small':
      return 'p-3'
    case 'large':
      return 'p-8'
    case 'medium':
    default:
      return 'p-6'
  }
}

export function CardWrapper({
  header,
  description,
  footer,
  variant = 'default',
  padding = 'medium',
  className,
  children,
}: CardWrapperProps) {
  const [useShadcn] = useFeatureFlag(FEATURE_FLAGS.USE_SHADCN_CARD)

  if (useShadcn) {
    // Use shadcn/ui Card components
    return (
      <ShadcnCard className={className} data-testid="card-wrapper">
        {(header || description) && (
          <CardHeader data-testid="card-header">
            {header && (
              typeof header === 'string' ? (
                <CardTitle>{header}</CardTitle>
              ) : (
                header
              )
            )}
            {description && (
              typeof description === 'string' ? (
                <CardDescription>{description}</CardDescription>
              ) : (
                description
              )
            )}
          </CardHeader>
        )}

        <CardContent
          className={mapPaddingToShadcn(padding)}
          data-testid="card-content"
        >
          {children}
        </CardContent>

        {footer && (
          <CardFooter data-testid="card-footer">
            {footer}
          </CardFooter>
        )}
      </ShadcnCard>
    )
  }

  // Use legacy card with class names
  const legacyClasses = cn(
    'card',
    variant !== 'default' && `card--${variant}`,
    padding !== 'medium' && `card--padding-${padding}`,
    className
  )

  return (
    <div className={legacyClasses}>
      {(header || description) && (
        <div className="card__header">
          {header && (
            typeof header === 'string' ? (
              <h3 className="card__title">{header}</h3>
            ) : (
              header
            )
          )}
          {description && (
            <p className="card__description">{description}</p>
          )}
        </div>
      )}

      <div className="card__content">
        {children}
      </div>

      {footer && (
        <div className="card__footer">
          {footer}
        </div>
      )}
    </div>
  )
}