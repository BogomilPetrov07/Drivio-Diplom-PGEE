import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks.js'
import type { Role } from '../types.js'

interface AuthzGuardProps {
  allowedRoles: Role[]
}

export default function AuthzGuard({ allowedRoles }: AuthzGuardProps) {
  const { role, isAuthenticated } = useAuth()

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

