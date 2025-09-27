import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FeatureFlagProvider } from '@/shared/lib/feature-flags'

import { CardWrapper, type CardWrapperProps } from '../CardWrapper'

describe('CardWrapper Component', () => {
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

    it('should render legacy card with correct class', () => {
      render(
        <FeatureFlagProvider>
          <CardWrapper>Card content</CardWrapper>
        </FeatureFlagProvider>
      )

      const card = screen.getByText('Card content')
      expect(card).toBeInTheDocument()
      expect(card.parentElement).toHaveClass('card')
    })

    it('should render card header with legacy styling', () => {
      render(
        <FeatureFlagProvider>
          <CardWrapper header="Card Title">Card content</CardWrapper>
        </FeatureFlagProvider>
      )

      const header = screen.getByText('Card Title')
      expect(header).toBeInTheDocument()
      expect(header.parentElement).toHaveClass('card__header')
    })

    it('should render card footer with legacy styling', () => {
      const { container } = render(
        <FeatureFlagProvider>
          <CardWrapper footer="Card Footer">Card content</CardWrapper>
        </FeatureFlagProvider>
      )

      const footerElement = container.querySelector('.card__footer')
      expect(footerElement).toBeInTheDocument()
      expect(footerElement).toHaveTextContent('Card Footer')
    })

    it('should render card description with legacy styling', () => {
      render(
        <FeatureFlagProvider>
          <CardWrapper header="Title" description="Card description">
            Card content
          </CardWrapper>
        </FeatureFlagProvider>
      )

      const description = screen.getByText('Card description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveClass('card__description')
    })

    it('should merge custom className', () => {
      render(
        <FeatureFlagProvider>
          <CardWrapper className="custom-card-class">Card content</CardWrapper>
        </FeatureFlagProvider>
      )

      const card = screen.getByText('Card content').parentElement
      expect(card).toHaveClass('card')
      expect(card).toHaveClass('custom-card-class')
    })

    it('should handle variant prop', () => {
      const { rerender } = render(
        <FeatureFlagProvider>
          <CardWrapper variant="outlined">Outlined card</CardWrapper>
        </FeatureFlagProvider>
      )

      let card = screen.getByText('Outlined card').parentElement
      expect(card).toHaveClass('card--outlined')

      rerender(
        <FeatureFlagProvider>
          <CardWrapper variant="elevated">Elevated card</CardWrapper>
        </FeatureFlagProvider>
      )

      card = screen.getByText('Elevated card').parentElement
      expect(card).toHaveClass('card--elevated')
    })

    it('should apply padding prop', () => {
      const { rerender } = render(
        <FeatureFlagProvider>
          <CardWrapper padding="none">No padding</CardWrapper>
        </FeatureFlagProvider>
      )

      let card = screen.getByText('No padding').parentElement
      expect(card).toHaveClass('card--padding-none')

      rerender(
        <FeatureFlagProvider>
          <CardWrapper padding="small">Small padding</CardWrapper>
        </FeatureFlagProvider>
      )

      card = screen.getByText('Small padding').parentElement
      expect(card).toHaveClass('card--padding-small')
    })
  })

  describe('shadcn/ui Mode (Feature Flag ON)', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockReturnValue('true') // Flag is on
    })

    it('should render shadcn/ui Card component', () => {
      render(
        <FeatureFlagProvider>
          <CardWrapper>Card content</CardWrapper>
        </FeatureFlagProvider>
      )

      const card = screen.getByText('Card content').closest('[data-testid="card-wrapper"]')
      expect(card).toBeInTheDocument()
      // shadcn Card specific classes
      expect(card).toHaveClass('rounded-xl')
      expect(card).toHaveClass('border')
      expect(card).toHaveClass('bg-card')
    })

    it('should use CardHeader component for header', () => {
      render(
        <FeatureFlagProvider>
          <CardWrapper header="Card Title">Card content</CardWrapper>
        </FeatureFlagProvider>
      )

      const header = screen.getByText('Card Title')
      expect(header).toBeInTheDocument()
      // shadcn CardHeader specific structure
      const headerContainer = header.closest('[data-testid="card-header"]')
      expect(headerContainer).toHaveClass('flex')
      expect(headerContainer).toHaveClass('flex-col')
      expect(headerContainer).toHaveClass('space-y-1.5')
    })

    it('should use CardDescription for description', () => {
      render(
        <FeatureFlagProvider>
          <CardWrapper header="Title" description="Card description">
            Card content
          </CardWrapper>
        </FeatureFlagProvider>
      )

      const description = screen.getByText('Card description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveClass('text-muted-foreground')
    })

    it('should use CardFooter for footer', () => {
      render(
        <FeatureFlagProvider>
          <CardWrapper footer="Card Footer">Card content</CardWrapper>
        </FeatureFlagProvider>
      )

      const footer = screen.getByText('Card Footer')
      expect(footer).toBeInTheDocument()
      const footerContainer = footer.closest('[data-testid="card-footer"]')
      expect(footerContainer).toHaveClass('flex')
      expect(footerContainer).toHaveClass('items-center')
    })

    it('should use CardContent for body', () => {
      render(
        <FeatureFlagProvider>
          <CardWrapper>Card content</CardWrapper>
        </FeatureFlagProvider>
      )

      const content = screen.getByText('Card content')
      const contentContainer = content.closest('[data-testid="card-content"]')
      expect(contentContainer).toBeInTheDocument()
    })

    it('should handle padding prop in shadcn mode', () => {
      const { rerender } = render(
        <FeatureFlagProvider>
          <CardWrapper padding="none">No padding</CardWrapper>
        </FeatureFlagProvider>
      )

      let content = screen.getByText('No padding').closest('[data-testid="card-content"]')
      expect(content).toHaveClass('p-0')

      rerender(
        <FeatureFlagProvider>
          <CardWrapper padding="small">Small padding</CardWrapper>
        </FeatureFlagProvider>
      )

      content = screen.getByText('Small padding').closest('[data-testid="card-content"]')
      expect(content).toHaveClass('p-3')

      rerender(
        <FeatureFlagProvider>
          <CardWrapper padding="large">Large padding</CardWrapper>
        </FeatureFlagProvider>
      )

      content = screen.getByText('Large padding').closest('[data-testid="card-content"]')
      expect(content).toHaveClass('p-8')
    })
  })

  describe('Complex Card Structures', () => {
    it('should render card with all sections in legacy mode', () => {
      localStorageMock.getItem.mockReturnValue(null)

      render(
        <FeatureFlagProvider>
          <CardWrapper
            header="Card Title"
            description="Card description"
            footer="Card footer"
          >
            Main content
          </CardWrapper>
        </FeatureFlagProvider>
      )

      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card description')).toBeInTheDocument()
      expect(screen.getByText('Main content')).toBeInTheDocument()
      expect(screen.getByText('Card footer')).toBeInTheDocument()
    })

    it('should render card with all sections in shadcn mode', () => {
      localStorageMock.getItem.mockReturnValue('true')

      render(
        <FeatureFlagProvider>
          <CardWrapper
            header="Card Title"
            description="Card description"
            footer="Card footer"
          >
            Main content
          </CardWrapper>
        </FeatureFlagProvider>
      )

      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card description')).toBeInTheDocument()
      expect(screen.getByText('Main content')).toBeInTheDocument()
      expect(screen.getByText('Card footer')).toBeInTheDocument()
    })

    it('should handle React elements as header and footer', () => {
      const HeaderComponent = () => <h3>Custom Header</h3>
      const FooterComponent = () => <div>Custom Footer</div>

      render(
        <FeatureFlagProvider>
          <CardWrapper
            header={<HeaderComponent />}
            footer={<FooterComponent />}
          >
            Content
          </CardWrapper>
        </FeatureFlagProvider>
      )

      expect(screen.getByText('Custom Header')).toBeInTheDocument()
      expect(screen.getByText('Custom Footer')).toBeInTheDocument()
    })
  })

  describe('Dynamic Feature Flag Toggle', () => {
    it('should switch between legacy and shadcn when flag changes', () => {
      // Initially legacy mode
      localStorageMock.getItem.mockReturnValue(null)

      const { rerender, container } = render(
        <FeatureFlagProvider>
          <CardWrapper>Toggle Test</CardWrapper>
        </FeatureFlagProvider>
      )

      let card = container.querySelector('.card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('card')

      // Switch to shadcn mode
      localStorageMock.getItem.mockReturnValue('true')

      // Force complete re-mount to pick up new localStorage values
      rerender(
        <FeatureFlagProvider key="remount">
          <CardWrapper>Toggle Test</CardWrapper>
        </FeatureFlagProvider>
      )

      card = screen.getByText('Toggle Test').closest('[data-testid="card-wrapper"]')
      expect(card).toHaveClass('rounded-xl')
    })
  })

  describe('TypeScript Types', () => {
    it('should accept valid CardWrapperProps', () => {
      const validProps: CardWrapperProps = {
        header: 'Title',
        description: 'Description',
        footer: 'Footer',
        variant: 'outlined',
        padding: 'medium',
        className: 'custom',
        children: 'Content',
      }

      render(
        <FeatureFlagProvider>
          <CardWrapper {...validProps} />
        </FeatureFlagProvider>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should handle all variant types', () => {
      const variants: NonNullable<CardWrapperProps['variant']>[] = ['default', 'outlined', 'elevated']

      variants.forEach((variant) => {
        render(
          <FeatureFlagProvider>
            <CardWrapper variant={variant}>{variant} card</CardWrapper>
          </FeatureFlagProvider>
        )
      })

      expect(screen.getByText('default card')).toBeInTheDocument()
      expect(screen.getByText('outlined card')).toBeInTheDocument()
      expect(screen.getByText('elevated card')).toBeInTheDocument()
    })

    it('should handle all padding types', () => {
      const paddings: NonNullable<CardWrapperProps['padding']>[] = ['none', 'small', 'medium', 'large']

      paddings.forEach((padding) => {
        render(
          <FeatureFlagProvider>
            <CardWrapper padding={padding}>{padding} padding</CardWrapper>
          </FeatureFlagProvider>
        )
      })

      expect(screen.getByText('none padding')).toBeInTheDocument()
      expect(screen.getByText('small padding')).toBeInTheDocument()
      expect(screen.getByText('medium padding')).toBeInTheDocument()
      expect(screen.getByText('large padding')).toBeInTheDocument()
    })
  })
})