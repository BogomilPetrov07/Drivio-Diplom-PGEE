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
}

export interface AuthResponse {
  user: AuthUser
}

export const ROLE_DASHBOARD_PATH: Record<Role, string> = {
  SUPERADMIN: '/dashboard/superadmin',
  SCHOOLADMIN: '/dashboard/school-admin',
  INSTRUCTOR: '/dashboard/instructor',
  STUDENT: '/dashboard/student',
}

export const ROLE_PRIORITY: Role[] = ['SUPERADMIN', 'SCHOOLADMIN', 'INSTRUCTOR', 'STUDENT']

export function getRoleDashboardPath(role: Role) {
  return ROLE_DASHBOARD_PATH[role]
}

