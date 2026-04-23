import { Calendar, CalendarDays, CarFront, GraduationCap, LayoutDashboard, LifeBuoy, Mail, School, UsersRound } from 'lucide-react'
import DashboardShell, { type DashboardNavItem } from '../components/DashboardShell.js'
import type { Language } from '../../../i18n/language'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import { useAuth } from '../../auth/hooks.js'

interface Props {
  language: Language
  setLanguage: (language: Language) => void
  themePreference: 'system' | 'light' | 'dark'
  resolvedTheme: 'drivio-light' | 'drivio-dark'
  setThemePreference: (theme: 'system' | 'light' | 'dark') => void
}

export default function SchoolAdminLayout({ language, setLanguage, themePreference, resolvedTheme, setThemePreference }: Props) {
  const t = getDashboardTranslations(language)
  const { user } = useAuth()

  const navItems: DashboardNavItem[] = [
    { kind: 'section', label: t.layout.schoolAdminSection },
    { kind: 'link', to: '/dashboard/schooladmin/home', label: t.layout.home, icon: <LayoutDashboard className='h-4 w-4' /> },
    { kind: 'link', to: '/dashboard/schooladmin/school', label: t.layout.schoolProfile, icon: <School className='h-4 w-4' /> },
    { kind: 'link', to: '/dashboard/schooladmin/inbox', label: t.layout.inbox, icon: <Mail className='h-4 w-4' /> },
    { kind: 'link', to: '/dashboard/schooladmin/people', label: t.layout.people, icon: <UsersRound className='h-4 w-4' /> },
    { kind: 'link', to: '/dashboard/schooladmin/cars', label: t.layout.cars, icon: <CarFront className='h-4 w-4' /> },
  ]

  if (user?.hasInstructorPrivileges) {
    navItems.push(
      { kind: 'divider' },
      { kind: 'section', label: t.layout.instructorSection },
      { kind: 'link', to: '/dashboard/schooladmin/instructor/planner', label: t.layout.planner, icon: <Calendar className='h-4 w-4' /> },
      { kind: 'link', to: '/dashboard/schooladmin/instructor/schedule', label: t.layout.schedule, icon: <CalendarDays className='h-4 w-4' /> },
      { kind: 'link', to: '/dashboard/schooladmin/instructor/students', label: t.layout.students, icon: <GraduationCap className='h-4 w-4' /> },
      { kind: 'divider' },
    )
  }
  navItems.push({ kind: 'link', to: '/dashboard/schooladmin/support', label: t.layout.help, icon: <LifeBuoy className='h-4 w-4' /> })

  return (
    <DashboardShell
      language={language}
      setLanguage={setLanguage}
      themePreference={themePreference}
      resolvedTheme={resolvedTheme}
      setThemePreference={setThemePreference}
      navItems={navItems}
    />
  )
}
