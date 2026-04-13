import { BarChart3, CircleHelp, ClipboardList, LayoutDashboard, LifeBuoy } from 'lucide-react'
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

export default function SuperAdminLayout({ language, setLanguage, themePreference, resolvedTheme, setThemePreference }: Props) {
  const t = getDashboardTranslations(language)
  return (
    <DashboardShell
      language={language}
      setLanguage={setLanguage}
      themePreference={themePreference}
      resolvedTheme={resolvedTheme}
      setThemePreference={setThemePreference}
      navItems={[
        { to: '/dashboard/superadmin/home', label: t.layout.home, icon: <LayoutDashboard className='h-4 w-4' /> },
        { to: '/dashboard/superadmin/statistics', label: t.layout.statistics, icon: <BarChart3 className='h-4 w-4' /> },
        { to: '/dashboard/superadmin/requests', label: 'Requests', icon: <ClipboardList className='h-4 w-4' /> },
        { to: '/dashboard/superadmin/support', label: t.layout.help, icon: <LifeBuoy className='h-4 w-4' /> },
        { to: '/dashboard/superadmin/faqs', label: 'FAQs', icon: <CircleHelp className='h-4 w-4' /> },
      ]}
    />
  )
}
