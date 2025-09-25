import { createRoot } from 'react-dom/client'

import { AppProviders } from '@/app/providers/AppProviders'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Failed to find root element')
}

createRoot(rootElement).render(<AppProviders />)
