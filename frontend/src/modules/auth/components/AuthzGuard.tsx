import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks.js'
import type { Role } from '../types.js'

interface AuthzGuardProps {
  allowedRoles: Role[]
}

export default function AuthzGuard({ allowedRoles }: AuthzGuardProps) {
  const { role, roles, isAuthenticated } = useAuth()

  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />
  }

  const userRoles = roles.length ? roles : [role]
  if (!userRoles.some((userRole) => allowedRoles.includes(userRole))) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}

