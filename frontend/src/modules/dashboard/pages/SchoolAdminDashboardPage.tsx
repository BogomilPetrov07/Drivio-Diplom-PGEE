import { getDashboardTranslations } from '../../../i18n/dashboard'
import type { Language } from '../../../i18n/language'
import DashboardShell from '../components/DashboardShell.js'

interface SchoolAdminDashboardPageProps {
  language: Language
  setLanguage: (language: Language) => void
  themePreference: 'system' | 'light' | 'dark'
  resolvedTheme: 'drivio-pro-light' | 'drivio-pro-dark'
  setThemePreference: (theme: 'system' | 'light' | 'dark') => void
}

export default function SchoolAdminDashboardPage({
  language,
  setLanguage,
  themePreference,
  resolvedTheme,
  setThemePreference,
}: SchoolAdminDashboardPageProps) {
  const t = getDashboardTranslations(language).roles.schoolAdmin

  return (
    <DashboardShell
      language={language}
      setLanguage={setLanguage}
      themePreference={themePreference}
      resolvedTheme={resolvedTheme}
      setThemePreference={setThemePreference}
      title={t.title}
      subtitle={t.subtitle}
      items={t.items}
    />
  )
}


