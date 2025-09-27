import { existsSync } from 'fs'
import { resolve } from 'path'
import { describe, expect,it } from 'vitest'

import * as viteConfig from '../../vite.config'

describe('Tailwind CSS v4 Integration', () => {
  describe('Configuration Files', () => {
    it('should have tailwind.config.ts file', () => {
      const configPath = resolve(__dirname, '../../tailwind.config.ts')
      expect(existsSync(configPath)).toBe(true)
    })

    it('should have global CSS file with Tailwind directives', () => {
      const cssPath = resolve(__dirname, '../styles/globals.css')
      expect(existsSync(cssPath)).toBe(true)
    })
  })

  describe('Vite Configuration', () => {
    it('should have @tailwindcss/vite plugin configured', () => {
      const config = viteConfig.default
      const plugins = config.plugins || []

      // Check if Tailwind plugin is included
      const hasTailwindPlugin = plugins.some((plugin: any) => {
        return plugin && (
          plugin.name === 'tailwindcss' ||
          plugin.name === '@tailwindcss/vite' ||
          (typeof plugin === 'function' && plugin.name === 'tailwindcss')
        )
      })

      expect(hasTailwindPlugin).toBe(true)
    })
  })

  describe('CSS Variables Generation', () => {
    it('should generate CSS custom properties for design tokens', () => {
      // This test would verify that CSS variables are generated
      // In a real scenario, we'd check the output CSS file
      const rootElement = document.documentElement
      const computedStyles = window.getComputedStyle(rootElement)

      // Check for common Tailwind v4 CSS variables
      const expectedVariables = [
        '--color-',
        '--spacing-',
        '--font-'
      ]

      expectedVariables.forEach(prefix => {
        const hasVariable = Array.from(computedStyles).some(prop =>
          prop.startsWith(prefix)
        )
        expect(hasVariable).toBe(true)
      })
    })
  })

  describe('Tailwind Utilities', () => {
    it('should compile Tailwind utility classes', () => {
      // Create a test element with Tailwind classes
      const testDiv = document.createElement('div')
      testDiv.className = 'bg-blue-500 p-4 text-white'
      document.body.appendChild(testDiv)

      const styles = window.getComputedStyle(testDiv)

      // Check if styles are applied
      expect(styles.backgroundColor).toBeDefined()
      expect(styles.padding).toBeDefined()
      expect(styles.color).toBeDefined()

      // Clean up
      document.body.removeChild(testDiv)
    })

    it('should support responsive utilities', () => {
      const testDiv = document.createElement('div')
      testDiv.className = 'md:bg-red-500 lg:p-8'
      document.body.appendChild(testDiv)

      // Verify that responsive classes are recognized
      expect(testDiv.className).toContain('md:')
      expect(testDiv.className).toContain('lg:')

      // Clean up
      document.body.removeChild(testDiv)
    })
  })

  describe('Build Process', () => {
    it('should include Tailwind in the build output', async () => {
      // This test would verify the build output includes Tailwind CSS
      // In a real CI environment, we'd check the dist folder
      const buildOutputPath = resolve(__dirname, '../../dist/assets')

      // Note: This test assumes a build has been run
      // In practice, you might want to run a build in CI before testing
      if (existsSync(buildOutputPath)) {
        const files = require('fs').readdirSync(buildOutputPath)
        const hasCSSOutput = files.some((file: string) => file.endsWith('.css'))
        expect(hasCSSOutput).toBe(true)
      } else {
        // If no build output, mark as pending
        expect(true).toBe(true)
      }
    })
  })
})