/// <reference types="tailwindcss" />

declare module 'tailwindcss/types/config' {
  import { Config } from 'tailwindcss'
  export default Config
}

declare module '@tailwindcss/vite' {
  import { Plugin } from 'vite'
  const plugin: () => Plugin
  export default plugin
}

// Extend the global CSS module declarations for Tailwind utilities
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

// Type definitions for custom theme extensions
declare namespace Tailwind {
  interface CustomColors {
    primary: {
      DEFAULT: string
      50: string
      100: string
      200: string
      300: string
      400: string
      500: string
      600: string
      700: string
      800: string
      900: string
    }
    secondary: {
      DEFAULT: string
      50: string
      100: string
      200: string
      300: string
      400: string
      500: string
      600: string
      700: string
      800: string
      900: string
    }
    success: {
      DEFAULT: string
      50: string
      100: string
      200: string
      300: string
      400: string
      500: string
      600: string
      700: string
      800: string
      900: string
    }
    danger: {
      DEFAULT: string
      50: string
      100: string
      200: string
      300: string
      400: string
      500: string
      600: string
      700: string
      800: string
      900: string
    }
    background: {
      DEFAULT: string
      light: string
      dark: string
    }
  }

  interface CustomSpacing {
    '18': string
    '88': string
    '100': string
    '120': string
  }

  interface CustomBoxShadow {
    'hero': string
    'card': string
    'auth': string
    'button': string
    'input-focus': string
  }
}

// Utility type for Tailwind class names
export type TailwindClassName = string

// Helper type for conditional class names
export type ConditionalClassName<T extends string> = T | `${T}` | undefined | null | false

// Utility function type for merging class names
export interface ClassNameUtil {
  (
    ...classes: Array<
      TailwindClassName | ConditionalClassName<TailwindClassName> | Record<string, boolean>
    >
  ): string
}