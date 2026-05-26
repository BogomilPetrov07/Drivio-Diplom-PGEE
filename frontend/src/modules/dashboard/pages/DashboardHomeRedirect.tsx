import { Navigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks.js'
import { getRoleDashboardPath } from '../../auth/types.js'
import { getDashboardStartPage } from '../../../utils/preferences'

const ROLE_SEGMENT_BY_ROLE = {
  SUPERADMIN: 'superadmin',
  SCHOOLADMIN: 'schooladmin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
} as const

export default function DashboardHomeRedirect() {
  const { role } = useAuth()

  if (!role) {
    return <Navigate to="/login" replace />
  }

  const roleSegment = ROLE_SEGMENT_BY_ROLE[role]
  const preferredStartPage = getDashboardStartPage(roleSegment)

  return <Navigate to={preferredStartPage ?? getRoleDashboardPath(role)} replace />
}

