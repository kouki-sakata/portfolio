import { Navigate } from 'react-router-dom'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { EmployeeAdminPage } from '@/features/employees/components/EmployeeAdminPage'

export const EmployeeAdminRoute = () => {
  const { user } = useAuth()

  if (!user?.admin) {
    return <Navigate to="/" replace />
  }

  return <EmployeeAdminPage />
}
