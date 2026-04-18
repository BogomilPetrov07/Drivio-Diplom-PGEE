export const ROLES = ['SUPERADMIN', 'SCHOOLADMIN', 'INSTRUCTOR', 'STUDENT'] as const

export type Role = (typeof ROLES)[number]

export interface LoginDTO {
  username: string
  password: string
}

export interface AuthUser {
  id: string
  username: string
  email: string | null
  role: Role
  roles: Role[]
  activeRole: Role
  hasInstructorPrivileges: boolean
}

export interface AuthResponse {
  user: AuthUser
}

export const ROLE_DASHBOARD_PATH: Record<Role, string> = {
  SUPERADMIN: '/dashboard/superadmin/home',
  SCHOOLADMIN: '/dashboard/schooladmin/home',
  INSTRUCTOR: '/dashboard/instructor/home',
  STUDENT: '/dashboard/student/home',
}

export const ROLE_PRIORITY: Role[] = ['SUPERADMIN', 'SCHOOLADMIN', 'INSTRUCTOR', 'STUDENT']

export function getRoleDashboardPath(role: Role) {
  return ROLE_DASHBOARD_PATH[role]
}

export function getPreferredRole(user: AuthUser | null): Role | null {
  if (!user) return null
  const available = user.roles?.length ? user.roles : [user.role]
  const byActiveRole = available.find((role) => role === user.activeRole)
  if (byActiveRole) return byActiveRole
  return ROLE_PRIORITY.find((role) => available.includes(role)) ?? available[0] ?? null
}
