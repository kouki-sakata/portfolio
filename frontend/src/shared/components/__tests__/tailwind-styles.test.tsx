import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect,it } from 'vitest'

// Test component using Tailwind utilities
function TestButton({ children, variant = 'primary' }: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
}) {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors'
  const variantClasses = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  }

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </button>
  )
}

// Test component for design tokens
function TestCard({ title, children }: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white shadow-lg rounded-xl p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      <div className="text-gray-600">{children}</div>
    </div>
  )
}

describe('Tailwind CSS Styles', () => {
  describe('Utility Classes', () => {
    it('should apply spacing utilities correctly', () => {
      render(
        <div className="p-4 m-2" data-testid="spacing-test">
          Test Content
        </div>
      )

      const element = screen.getByTestId('spacing-test')
      expect(element).toBeTruthy()
      expect(element.className).toContain('p-4')
      expect(element.className).toContain('m-2')
    })

    it('should apply color utilities correctly', () => {
      render(
        <div className="bg-blue-500 text-white" data-testid="color-test">
          Colored Content
        </div>
      )

      const element = screen.getByTestId('color-test')
      expect(element).toBeTruthy()
      expect(element.className).toContain('bg-blue-500')
      expect(element.className).toContain('text-white')
    })

    it('should apply typography utilities correctly', () => {
      render(
        <p className="text-lg font-semibold leading-relaxed" data-testid="typography-test">
          Typography Test
        </p>
      )

      const element = screen.getByTestId('typography-test')
      expect(element).toBeTruthy()
      expect(element.className).toContain('text-lg')
      expect(element.className).toContain('font-semibold')
      expect(element.className).toContain('leading-relaxed')
    })

    it('should apply layout utilities correctly', () => {
      render(
        <div className="flex items-center justify-between gap-4" data-testid="layout-test">
          <span>Item 1</span>
          <span>Item 2</span>
        </div>
      )

      const element = screen.getByTestId('layout-test')
      expect(element).toBeTruthy()
      expect(element.className).toContain('flex')
      expect(element.className).toContain('items-center')
      expect(element.className).toContain('justify-between')
      expect(element.className).toContain('gap-4')
    })
  })

  describe('Design Tokens', () => {
    it('should apply custom color tokens', () => {
      render(
        <TestButton variant="primary">Primary Button</TestButton>
      )

      const button = screen.getByText('Primary Button')
      expect(button.className).toContain('bg-blue-500')
      expect(button.className).toContain('hover:bg-blue-600')
    })

    it('should apply spacing tokens consistently', () => {
      render(
        <div data-testid="test-card">
          <TestCard title="Test Card">
            This card uses consistent spacing tokens
          </TestCard>
        </div>
      )

      const cardContent = screen.getByText('This card uses consistent spacing tokens')
      expect(cardContent).toBeInTheDocument()
    })

    it('should apply shadow tokens', () => {
      render(
        <div className="shadow-sm shadow-md shadow-lg shadow-xl" data-testid="shadow-test">
          Shadow Test
        </div>
      )

      const element = screen.getByTestId('shadow-test')
      expect(element).toBeTruthy()
      expect(element.className).toMatch(/shadow-(sm|md|lg|xl)/)
    })
  })

  describe('Responsive Utilities', () => {
    it('should include responsive modifiers', () => {
      render(
        <div
          className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4"
          data-testid="responsive-test"
        >
          Responsive Content
        </div>
      )

      const element = screen.getByTestId('responsive-test')
      expect(element).toBeTruthy()
      expect(element.className).toContain('md:w-1/2')
      expect(element.className).toContain('lg:w-1/3')
      expect(element.className).toContain('xl:w-1/4')
    })

    it('should support responsive display utilities', () => {
      render(
        <div
          className="block md:flex lg:grid"
          data-testid="display-test"
        >
          Display Test
        </div>
      )

      const element = screen.getByTestId('display-test')
      expect(element).toBeTruthy()
      expect(element.className).toContain('block')
      expect(element.className).toContain('md:flex')
      expect(element.className).toContain('lg:grid')
    })
  })

  describe('Dark Mode Support', () => {
    it('should include dark mode variants', () => {
      render(
        <div
          className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
          data-testid="dark-mode-test"
        >
          Dark Mode Content
        </div>
      )

      const element = screen.getByTestId('dark-mode-test')
      expect(element).toBeTruthy()
      expect(element.className).toContain('dark:bg-gray-900')
      expect(element.className).toContain('dark:text-white')
    })
  })

  describe('Component Composition', () => {
    it('should compose multiple utilities correctly', () => {
      render(
        <TestButton variant="secondary">Secondary Action</TestButton>
      )

      const button = screen.getByText('Secondary Action')
      // Check that multiple utility classes are applied
      expect(button.className).toContain('px-4')
      expect(button.className).toContain('py-2')
      expect(button.className).toContain('rounded-lg')
      expect(button.className).toContain('font-medium')
      expect(button.className).toContain('transition-colors')
      expect(button.className).toContain('bg-gray-200')
    })

    it('should handle complex component compositions', () => {
      render(
        <TestCard title="Complex Card">
          <div className="flex items-start gap-4" data-testid="flex-container">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex-shrink-0" data-testid="avatar" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Subtitle</p>
              <p className="mt-1 text-base">Main content here</p>
            </div>
          </div>
        </TestCard>
      )

      const flexContainer = screen.getByTestId('flex-container')
      expect(flexContainer).toBeTruthy()
      expect(flexContainer.className).toContain('flex')
      expect(flexContainer.className).toContain('items-start')
      expect(flexContainer.className).toContain('gap-4')

      const avatar = screen.getByTestId('avatar')
      expect(avatar).toBeTruthy()
      expect(avatar.className).toContain('w-12')
      expect(avatar.className).toContain('h-12')
      expect(avatar.className).toContain('bg-blue-100')
      expect(avatar.className).toContain('rounded-full')
    })
  })
})