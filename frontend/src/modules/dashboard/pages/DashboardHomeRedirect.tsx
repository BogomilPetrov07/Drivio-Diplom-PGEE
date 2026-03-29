import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks.js'
import { getRoleDashboardPath } from '../../auth/types.js'

export default function DashboardHomeRedirect() {
  const { role } = useAuth()

  if (!role) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={getRoleDashboardPath(role)} replace />
}

