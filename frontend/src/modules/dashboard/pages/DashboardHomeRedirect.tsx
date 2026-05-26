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
  const { role, user } = useAuth()

  if (!role) {
    return <Navigate to="/login" replace />
  }

  const roleSegment = ROLE_SEGMENT_BY_ROLE[role]
  const preferredStartPage = getDashboardStartPage(roleSegment)
  const fallback = getRoleDashboardPath(role)

  if (!preferredStartPage) {
    return <Navigate to={fallback} replace />
  }

  if (!preferredStartPage.startsWith(`/dashboard/${roleSegment}/`)) {
    return <Navigate to={fallback} replace />
  }

  if (
    role === 'SCHOOLADMIN' &&
    preferredStartPage.startsWith('/dashboard/schooladmin/instructor/') &&
    !user?.hasInstructorPrivileges
  ) {
    return <Navigate to={fallback} replace />
  }

  return <Navigate to={preferredStartPage} replace />
}
