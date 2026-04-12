import { Globe, Monitor, Moon, Sun } from 'lucide-react'
import logoDark from '../../../assets/logo_dark.svg'
import logoLight from '../../../assets/logo_light.svg'
import { getPublicTranslations } from '../../../i18n/public'
import type { Language } from '../../../i18n/language'

interface AuthHeaderProps {
  themePreference: 'system' | 'light' | 'dark'
  resolvedTheme: 'drivio-pro-light' | 'drivio-pro-dark'
  setThemePreference: (theme: 'system' | 'light' | 'dark') => void
  language: Language
  setLanguage: (lang: Language) => void
}

export default function AuthHeader({
  themePreference,
  resolvedTheme,
  setThemePreference,
  language,
  setLanguage,
}: AuthHeaderProps) {
  const t = getPublicTranslations(language)
  const common = t.common

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-base-300 bg-base-100/95 backdrop-blur-md">
      <div className="container mx-auto h-20 px-6">
        <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={resolvedTheme === 'drivio-pro-light' ? logoLight : logoDark}
              alt="Drivio Logo"
              className="h-10 w-auto"
            />
            <span className="text-2xl font-bold tracking-tight text-primary">Drivio</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="dropdown dropdown-end">
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm"
                aria-label={common.changeLanguage}
              >
                <Globe className="h-5 w-5" />
              </button>
              <ul className="dropdown-content menu mt-2 w-32 rounded-xl border border-base-content/10 bg-base-100 p-2 shadow-xl">
                <li><button onClick={() => setLanguage('bg')} className={language === 'bg' ? 'active' : ''}>BG</button></li>
                <li><button onClick={() => setLanguage('en')} className={language === 'en' ? 'active' : ''}>EN</button></li>
              </ul>
            </div>

            <div className="dropdown dropdown-end">
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm"
                aria-label={common.changeTheme}
              >
                {themePreference === 'system' ? <Monitor className="h-5 w-5" /> : resolvedTheme === 'drivio-pro-dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>
              <ul className="dropdown-content menu mt-2 w-44 rounded-xl border border-base-content/10 bg-base-100 p-2 shadow-xl">
                <li><button onClick={() => setThemePreference('system')} className={themePreference === 'system' ? 'active' : ''}><Monitor className="h-4 w-4" /> {common.themeSystem}</button></li>
                <li><button onClick={() => setThemePreference('light')} className={themePreference === 'light' ? 'active' : ''}><Sun className="h-4 w-4" /> {common.themeLight}</button></li>
                <li><button onClick={() => setThemePreference('dark')} className={themePreference === 'dark' ? 'active' : ''}><Moon className="h-4 w-4" /> {common.themeDark}</button></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
