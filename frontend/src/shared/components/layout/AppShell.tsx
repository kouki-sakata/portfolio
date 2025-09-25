import type { PropsWithChildren } from 'react'

export const AppShell = ({ children }: PropsWithChildren) => (
  <div className="app-shell">
    {children}
  </div>
)
