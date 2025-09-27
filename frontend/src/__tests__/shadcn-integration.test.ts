import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect,it } from 'vitest'

describe('shadcn/ui Integration', () => {
  describe('Configuration', () => {
    it('should have components.json configuration file', () => {
      const configPath = resolve(__dirname, '../../components.json')
      expect(existsSync(configPath)).toBe(true)
    })

    it('should have correct components.json settings', () => {
      const configPath = resolve(__dirname, '../../components.json')
      if (existsSync(configPath)) {
        const config = JSON.parse(readFileSync(configPath, 'utf-8'))

        // Check path alias configuration
        expect(config.aliases?.components).toBe('@/shared/components')
        expect(config.aliases?.utils).toBe('@/lib/utils')

        // Check style configuration
        expect(config.style).toBe('new-york')
        expect(config.tailwind?.baseColor).toBeDefined()
        expect(config.tailwind?.cssVariables).toBe(true)
      }
    })
  })

  describe('Utils', () => {
    it('should have cn utility function', () => {
      const utilsPath = resolve(__dirname, '../lib/utils.ts')
      expect(existsSync(utilsPath)).toBe(true)
    })

    it('should export cn function from utils', async () => {
      const utils = await import('@/lib/utils')
      expect(utils.cn).toBeDefined()
      expect(typeof utils.cn).toBe('function')
    })

    it('should correctly merge class names with cn utility', async () => {
      const { cn } = await import('@/lib/utils')

      // Test basic class merging
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')

      // Test conditional classes
      expect(cn('bg-red-500', true && 'bg-blue-500')).toBe('bg-blue-500')
      expect(cn('text-sm', false && 'text-lg')).toBe('text-sm')

      // Test Tailwind conflict resolution
      expect(cn('p-2', 'p-4')).toBe('p-4')
    })
  })

  describe('Component Directory Structure', () => {
    it('should have ui components directory', () => {
      const uiPath = resolve(__dirname, '../shared/components/ui')
      expect(existsSync(uiPath)).toBe(true)
    })

    it('should have Button component', () => {
      const buttonPath = resolve(__dirname, '../shared/components/ui/button.tsx')
      expect(existsSync(buttonPath)).toBe(true)
    })

    it('should have Card component', () => {
      const cardPath = resolve(__dirname, '../shared/components/ui/card.tsx')
      expect(existsSync(cardPath)).toBe(true)
    })

    it('should have Toast component and toaster', () => {
      const toastPath = resolve(__dirname, '../shared/components/ui/toast.tsx')
      const toasterPath = resolve(__dirname, '../shared/components/ui/toaster.tsx')
      expect(existsSync(toastPath)).toBe(true)
      expect(existsSync(toasterPath)).toBe(true)
    })

    it('should have Input component', () => {
      const inputPath = resolve(__dirname, '../shared/components/ui/input.tsx')
      expect(existsSync(inputPath)).toBe(true)
    })

    it('should have Label component', () => {
      const labelPath = resolve(__dirname, '../shared/components/ui/label.tsx')
      expect(existsSync(labelPath)).toBe(true)
    })
  })

  describe('CSS Variables', () => {
    it('should have CSS variables defined in globals.css', () => {
      const cssPath = resolve(__dirname, '../styles/globals.css')
      const cssContent = readFileSync(cssPath, 'utf-8')

      // Check for CSS variable definitions
      expect(cssContent).toContain('--background:')
      expect(cssContent).toContain('--foreground:')
      expect(cssContent).toContain('--primary:')
      expect(cssContent).toContain('--secondary:')
      expect(cssContent).toContain('--muted:')
      expect(cssContent).toContain('--accent:')
      expect(cssContent).toContain('--destructive:')
      expect(cssContent).toContain('--border:')
      expect(cssContent).toContain('--input:')
      expect(cssContent).toContain('--ring:')
      expect(cssContent).toContain('--radius:')
    })

    it('should have dark mode CSS variables', () => {
      const cssPath = resolve(__dirname, '../styles/globals.css')
      const cssContent = readFileSync(cssPath, 'utf-8')

      // Check for dark mode variables
      expect(cssContent).toMatch(/\.dark\s*{[^}]*--background:/s)
      expect(cssContent).toMatch(/\.dark\s*{[^}]*--foreground:/s)
      expect(cssContent).toMatch(/\.dark\s*{[^}]*--primary:/s)
    })
  })

  describe('Dependencies', () => {
    it('should have required dependencies installed', () => {
      const packagePath = resolve(__dirname, '../../package.json')
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      }

      // Check for required utilities
      expect(deps.clsx).toBeDefined()
      expect(deps['tailwind-merge']).toBeDefined()
      expect(deps['class-variance-authority']).toBeDefined()
    })
  })
})