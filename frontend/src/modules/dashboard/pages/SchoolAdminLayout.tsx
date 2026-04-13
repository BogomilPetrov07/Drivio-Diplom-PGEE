import { CarFront, CalendarClock, LayoutDashboard, LifeBuoy, Mail, UsersRound } from 'lucide-react'
import DashboardShell from '../components/DashboardShell.js'
import type { Language } from '../../../i18n/language'
import { getDashboardTranslations } from '../../../i18n/dashboard'

interface Props {
  language: Language
  setLanguage: (language: Language) => void
  themePreference: 'system' | 'light' | 'dark'
  resolvedTheme: 'drivio-light' | 'drivio-dark'
  setThemePreference: (theme: 'system' | 'light' | 'dark') => void
}

export default function SchoolAdminLayout({ language, setLanguage, themePreference, resolvedTheme, setThemePreference }: Props) {
  const t = getDashboardTranslations(language)
  return (
    <DashboardShell
      language={language}
      setLanguage={setLanguage}
      themePreference={themePreference}
      resolvedTheme={resolvedTheme}
      setThemePreference={setThemePreference}
      navItems={[
        { to: '/dashboard/schooladmin/home', label: t.layout.home, icon: <LayoutDashboard className='h-4 w-4' /> },
        { to: '/dashboard/schooladmin/inbox', label: t.layout.inbox, icon: <Mail className='h-4 w-4' /> },
        { to: '/dashboard/schooladmin/people', label: t.layout.people, icon: <UsersRound className='h-4 w-4' /> },
        { to: '/dashboard/schooladmin/planner', label: t.layout.planner, icon: <CalendarClock className='h-4 w-4' /> },
        { to: '/dashboard/schooladmin/cars', label: t.layout.cars, icon: <CarFront className='h-4 w-4' /> },
        { to: '/dashboard/schooladmin/support', label: t.layout.help, icon: <LifeBuoy className='h-4 w-4' /> },
      ]}
    />
  )
}
