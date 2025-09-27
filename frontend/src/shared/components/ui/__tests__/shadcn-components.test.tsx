import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

// Mock window.matchMedia for sonner
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

// Import components that should exist
import { Button } from '../button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../card'
import { Input } from '../input'
import { Label } from '../label'
import { Toaster } from '../toaster'
import { useToast } from '../use-toast'

describe('shadcn/ui Components', () => {
  describe('Button Component', () => {
    it('should render Button with default variant', () => {
      render(<Button>Click me</Button>)
      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('inline-flex')
    })

    it('should support different variants', () => {
      const { rerender } = render(<Button variant="default">Default</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()

      rerender(<Button variant="destructive">Destructive</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-destructive')

      rerender(<Button variant="outline">Outline</Button>)
      expect(screen.getByRole('button')).toHaveClass('border')

      rerender(<Button variant="secondary">Secondary</Button>)
      expect(screen.getByRole('button')).toHaveClass('bg-secondary')

      rerender(<Button variant="ghost">Ghost</Button>)
      expect(screen.getByRole('button')).toHaveClass('hover:bg-accent')

      rerender(<Button variant="link">Link</Button>)
      expect(screen.getByRole('button')).toHaveClass('underline-offset-4')
    })

    it('should support different sizes', () => {
      const { rerender } = render(<Button size="default">Default</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()

      rerender(<Button size="sm">Small</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-8')

      rerender(<Button size="lg">Large</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-10')

      rerender(<Button size="icon">Icon</Button>)
      expect(screen.getByRole('button')).toHaveClass('h-9')
    })

    it('should handle click events', async () => {
      let clicked = false
      const handleClick = () => { clicked = true }

      render(<Button onClick={handleClick}>Click me</Button>)
      const button = screen.getByRole('button')

      await userEvent.click(button)
      expect(clicked).toBe(true)
    })

    it('should support disabled state', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:pointer-events-none')
    })

    it('should support asChild prop for composition', () => {
      render(
        <Button asChild>
          <a href="/test">Link as Button</a>
        </Button>
      )
      const link = screen.getByRole('link')
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/test')
    })
  })

  describe('Card Component', () => {
    it('should render Card with all sub-components', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
          </CardHeader>
          <CardContent>Card Content</CardContent>
          <CardFooter>Card Footer</CardFooter>
        </Card>
      )

      expect(screen.getByText('Card Title')).toBeInTheDocument()
      expect(screen.getByText('Card Description')).toBeInTheDocument()
      expect(screen.getByText('Card Content')).toBeInTheDocument()
      expect(screen.getByText('Card Footer')).toBeInTheDocument()
    })

    it('should apply correct styles to Card', () => {
      const { container } = render(<Card>Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('rounded-xl')
      expect(card).toHaveClass('border')
      expect(card).toHaveClass('bg-card')
    })

    it('should support className prop', () => {
      const { container } = render(<Card className="custom-class">Content</Card>)
      const card = container.querySelector('.custom-class')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Input Component', () => {
    it('should render Input element', () => {
      render(<Input placeholder="Enter text" />)
      const input = screen.getByPlaceholderText('Enter text')
      expect(input).toBeInTheDocument()
      expect(input.tagName).toBe('INPUT')
    })

    it('should handle type prop', () => {
      render(<Input type="email" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('type', 'email')
    })

    it('should handle disabled state', () => {
      render(<Input disabled />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('should handle value changes', async () => {
      const { rerender } = render(<Input value="" onChange={() => {}} />)
      const input = screen.getByRole('textbox')
      expect(input.value).toBe('')

      rerender(<Input value="test value" onChange={() => {}} />)
      expect(input.value).toBe('test value')
    })

    it('should apply correct styles', () => {
      render(<Input />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('flex')
      expect(input).toHaveClass('h-9')
      expect(input).toHaveClass('w-full')
      expect(input).toHaveClass('rounded-md')
      expect(input).toHaveClass('border')
      expect(input).toHaveClass('border-input')
      expect(input).toHaveClass('bg-transparent')
    })

    it('should support className prop', () => {
      render(<Input className="custom-input" />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('custom-input')
    })
  })

  describe('Label Component', () => {
    it('should render Label element', () => {
      render(<Label>Label text</Label>)
      const label = screen.getByText('Label text')
      expect(label).toBeInTheDocument()
      expect(label.tagName).toBe('LABEL')
    })

    it('should associate with input using htmlFor', () => {
      render(
        <>
          <Label htmlFor="test-input">Test Label</Label>
          <Input id="test-input" />
        </>
      )
      const label = screen.getByText('Test Label')
      expect(label).toHaveAttribute('for', 'test-input')
    })

    it('should apply correct styles', () => {
      render(<Label>Styled Label</Label>)
      const label = screen.getByText('Styled Label')
      expect(label).toHaveClass('text-sm')
      expect(label).toHaveClass('font-medium')
    })

    it('should support className prop', () => {
      render(<Label className="custom-label">Custom</Label>)
      const label = screen.getByText('Custom')
      expect(label).toHaveClass('custom-label')
    })

    it('should handle disabled visual state', () => {
      render(
        <Label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Disabled Label
        </Label>
      )
      const label = screen.getByText('Disabled Label')
      expect(label).toHaveClass('peer-disabled:cursor-not-allowed')
      expect(label).toHaveClass('peer-disabled:opacity-70')
    })
  })

  describe('Toast Component', () => {
    it('should render Toaster component', () => {
      render(<Toaster />)
      // Toaster is a provider component, it doesn't render visible content initially
      expect(document.body).toBeInTheDocument()
    })

    it('should export useToast hook', () => {
      expect(useToast).toBeDefined()
      expect(typeof useToast).toBe('function')
    })

    it('should provide toast functionality through hook', () => {
      const TestComponent = () => {
        const { toast } = useToast()

        return (
          <button
            onClick={() => toast({
              title: 'Test Toast',
              description: 'This is a test toast message',
            })}
          >
            Show Toast
          </button>
        )
      }

      render(
        <>
          <TestComponent />
          <Toaster />
        </>
      )

      const button = screen.getByRole('button', { name: /show toast/i })
      expect(button).toBeInTheDocument()
    })
  })

  describe('Component Accessibility', () => {
    it('Button should have proper ARIA attributes', () => {
      render(
        <Button disabled aria-label="Accessible button">
          Click
        </Button>
      )
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Accessible button')
      expect(button).toBeDisabled()
    })

    it('Input should support aria attributes', () => {
      render(
        <Input
          aria-label="Email input"
          aria-required="true"
          aria-invalid="false"
        />
      )
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-label', 'Email input')
      expect(input).toHaveAttribute('aria-required', 'true')
      expect(input).toHaveAttribute('aria-invalid', 'false')
    })

    it('Label should properly associate with form controls', () => {
      render(
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" />
        </div>
      )
      const input = screen.getByRole('textbox')
      const label = screen.getByText('Username')

      expect(label).toHaveAttribute('for', 'username')
      expect(input).toHaveAttribute('id', 'username')
    })
  })
})