import { CalendarDays, LayoutDashboard, LifeBuoy, Mail, Users } from 'lucide-react'
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

export default function InstructorLayout({ language, setLanguage, themePreference, resolvedTheme, setThemePreference }: Props) {
  const t = getDashboardTranslations(language)
  return (
    <DashboardShell
      language={language}
      setLanguage={setLanguage}
      themePreference={themePreference}
      resolvedTheme={resolvedTheme}
      setThemePreference={setThemePreference}
      navItems={[
        { to: '/dashboard/instructor/home', label: t.layout.home, icon: <LayoutDashboard className='h-4 w-4' /> },
        { to: '/dashboard/instructor/inbox', label: t.layout.inbox, icon: <Mail className='h-4 w-4' /> },
        { to: '/dashboard/instructor/schedule', label: t.layout.schedule, icon: <CalendarDays className='h-4 w-4' /> },
        { to: '/dashboard/instructor/students', label: t.layout.students, icon: <Users className='h-4 w-4' /> },
        { to: '/dashboard/instructor/support', label: t.layout.help, icon: <LifeBuoy className='h-4 w-4' /> },
      ]}
    />
  )
}
