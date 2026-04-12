import { getDashboardTranslations } from '../../../i18n/dashboard'
import type { Language } from '../../../i18n/language'
import DashboardShell from '../components/DashboardShell.js'

interface InstructorDashboardPageProps {
  language: Language
  setLanguage: (language: Language) => void
  themePreference: 'system' | 'light' | 'dark'
  resolvedTheme: 'drivio-pro-light' | 'drivio-pro-dark'
  setThemePreference: (theme: 'system' | 'light' | 'dark') => void
}

export default function InstructorDashboardPage({
  language,
  setLanguage,
  themePreference,
  resolvedTheme,
  setThemePreference,
}: InstructorDashboardPageProps) {
  const t = getDashboardTranslations(language).roles.instructor

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


