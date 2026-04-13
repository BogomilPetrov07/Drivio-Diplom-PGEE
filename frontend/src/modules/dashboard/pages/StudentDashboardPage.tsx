import { getDashboardTranslations } from '../../../i18n/dashboard'
import type { Language } from '../../../i18n/language'
import DashboardShell from '../components/DashboardShell.js'

interface StudentDashboardPageProps {
  language: Language
  setLanguage: (language: Language) => void
  themePreference: 'system' | 'light' | 'dark'
  resolvedTheme: 'drivio-light' | 'drivio-dark'
  setThemePreference: (theme: 'system' | 'light' | 'dark') => void
}

export default function StudentDashboardPage({
  language,
  setLanguage,
  themePreference,
  resolvedTheme,
  setThemePreference,
}: StudentDashboardPageProps) {
  const t = getDashboardTranslations(language).roles.student

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


