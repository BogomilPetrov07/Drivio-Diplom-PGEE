import type { Language } from '../../../i18n/language'

interface SuperAdminDashboardPageProps {
  language: Language
  setLanguage: (language: Language) => void
  themePreference: 'system' | 'light' | 'dark'
  resolvedTheme: 'drivio-light' | 'drivio-dark'
  setThemePreference: (theme: 'system' | 'light' | 'dark') => void
}

export default function SuperAdminDashboardPage(_: SuperAdminDashboardPageProps) {
  return null
}
