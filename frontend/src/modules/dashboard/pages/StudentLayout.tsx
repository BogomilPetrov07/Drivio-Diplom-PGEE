import { LayoutDashboard, LifeBuoy, LineChart, CalendarDays, UserRoundCheck } from 'lucide-react'
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

export default function StudentLayout({ language, setLanguage, themePreference, resolvedTheme, setThemePreference }: Props) {
  const t = getDashboardTranslations(language)
  return (
    <DashboardShell
      language={language}
      setLanguage={setLanguage}
      themePreference={themePreference}
      resolvedTheme={resolvedTheme}
      setThemePreference={setThemePreference}
      navItems={[
        { kind: 'link', to: '/dashboard/student/home', label: t.layout.home, icon: <LayoutDashboard className='h-4 w-4' /> },
        { kind: 'link', to: '/dashboard/student/instructors', label: t.layout.instructors, icon: <UserRoundCheck className='h-4 w-4' /> },
        { kind: 'link', to: '/dashboard/student/progress', label: t.layout.progress, icon: <LineChart className='h-4 w-4' /> },
        { kind: 'link', to: '/dashboard/student/schedule', label: t.layout.schedule, icon: <CalendarDays className='h-4 w-4' /> },
        { kind: 'link', to: '/dashboard/student/support', label: t.layout.help, icon: <LifeBuoy className='h-4 w-4' /> },
      ]}
    />
  )
}
