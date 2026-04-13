import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Bell,
  ChevronDown,
  Globe,
  LayoutDashboard,
  Menu,
  Monitor,
  Moon,
  Search,
  Sun,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks.js'
import api from '../../../services/api.js'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import type { Language } from '../../../i18n/language'
import logoLight from '../../../assets/logo_light.svg'
import logoDark from '../../../assets/logo_dark.svg'
import avatarPlaceholder from '../../../assets/logo_email_avatar.svg'

interface DashboardShellProps {
  language: Language
  setLanguage: (language: Language) => void
  themePreference: 'system' | 'light' | 'dark'
  resolvedTheme: 'drivio-light' | 'drivio-dark'
  setThemePreference: (theme: 'system' | 'light' | 'dark') => void
  title: string
  subtitle: string
  items: string[]
  children?: ReactNode
}

export default function DashboardShell({
  language,
  setLanguage,
  themePreference,
  resolvedTheme,
  setThemePreference,
  title,
  subtitle,
  items,
  children,
}: DashboardShellProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isTestingHello, setIsTestingHello] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement | null>(null)
  const languageRef = useRef<HTMLDivElement | null>(null)
  const themeRef = useRef<HTMLDivElement | null>(null)

  const t = getDashboardTranslations(language)
  const shell = t.shell
  const common = t.common
  const layout = t.layout

  const navItems = useMemo(() => items.slice(0, 4), [items])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false)
      if (languageRef.current && !languageRef.current.contains(target)) setLanguageOpen(false)
      if (themeRef.current && !themeRef.current.contains(target)) setThemeOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false)
        setLanguageOpen(false)
        setThemeOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // Ignore network/logout response errors and still navigate away.
    }
    navigate('/login', { replace: true })
  }

  const handleTestHello = async () => {
    setIsTestingHello(true)
    try {
      const response = await api.get<{ message: string }>('/auth/hello')
      window.alert(response.data.message)
    } catch {
      window.alert(shell.protectedHelloFailed)
    } finally {
      setIsTestingHello(false)
    }
  }

  return (
    <main className="min-h-screen bg-base-100">
      <section className="flex min-h-screen w-full overflow-hidden bg-base-100">
        <aside className="hidden w-72 shrink-0 bg-base-300 text-base-content lg:block">
          <div className="flex h-20 items-center border-b border-base-content/10 px-6">
            <img src={resolvedTheme === 'drivio-dark' ? logoDark : logoLight} alt="Drivio" className="h-8 w-auto" />
            <span className="ml-3 text-xl font-semibold">Drivio</span>
          </div>
          <nav className="p-4">
            <button type="button" className="mb-3 flex w-full items-center gap-3 rounded-xl bg-primary px-4 py-3 text-left text-primary-content">
              <LayoutDashboard className="h-4 w-4" />
              <span className="font-semibold">{title}</span>
            </button>
            {navItems.map((item) => (
              <div key={item} className="mb-2 rounded-xl px-4 py-2 text-sm text-base-content/80 hover:bg-base-200">
                {item}
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-20 items-center justify-between border-b border-base-300 px-4 md:px-8">
            <div className="flex items-center gap-3">
              <button type="button" className="btn btn-ghost btn-circle btn-sm lg:hidden" aria-label="menu">
                <Menu className="h-4 w-4" />
              </button>
              <label className="input input-bordered input-sm flex w-72 items-center gap-2 rounded-full bg-base-100">
                <Search className="h-4 w-4 opacity-60" />
                <input type="text" className="grow" placeholder={layout.searchPlaceholder} />
              </label>
            </div>

            <div className="flex items-center gap-2">
              <div ref={themeRef} className={`dropdown dropdown-end ${themeOpen ? 'dropdown-open' : ''}`}>
                <button type="button" className="btn btn-ghost btn-circle btn-sm" aria-label={common.changeTheme} onClick={() => { setThemeOpen((prev) => !prev); setLanguageOpen(false); setProfileOpen(false) }}>
                  {themePreference === 'system' ? <Monitor className="h-4 w-4" /> : resolvedTheme === 'drivio-dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
                <ul className="dropdown-content menu mt-2 w-44 rounded-xl border border-base-content/10 bg-base-100 p-2 shadow-xl">
                  <li><button onClick={() => { setThemePreference('system'); setThemeOpen(false) }} className={themePreference === 'system' ? 'active' : ''}><Monitor className="h-4 w-4" /> {common.themeSystem}</button></li>
                  <li><button onClick={() => { setThemePreference('light'); setThemeOpen(false) }} className={themePreference === 'light' ? 'active' : ''}><Sun className="h-4 w-4" /> {common.themeLight}</button></li>
                  <li><button onClick={() => { setThemePreference('dark'); setThemeOpen(false) }} className={themePreference === 'dark' ? 'active' : ''}><Moon className="h-4 w-4" /> {common.themeDark}</button></li>
                </ul>
              </div>

              <div ref={languageRef} className={`dropdown dropdown-end ${languageOpen ? 'dropdown-open' : ''}`}>
                <button type="button" className="btn btn-ghost btn-circle btn-sm" aria-label={common.changeLanguage} onClick={() => { setLanguageOpen((prev) => !prev); setThemeOpen(false); setProfileOpen(false) }}>
                  <Globe className="h-4 w-4" />
                </button>
                <ul className="dropdown-content menu mt-2 w-32 rounded-xl border border-base-content/10 bg-base-100 p-2 shadow-xl">
                  <li><button onClick={() => { setLanguage('bg'); setLanguageOpen(false) }} className={language === 'bg' ? 'active' : ''}>BG</button></li>
                  <li><button onClick={() => { setLanguage('en'); setLanguageOpen(false) }} className={language === 'en' ? 'active' : ''}>EN</button></li>
                </ul>
              </div>

              <button type="button" className="btn btn-ghost btn-circle btn-sm" aria-label={shell.notifications}>
                <Bell className="h-4 w-4" />
              </button>

              <div ref={profileRef} className={`dropdown dropdown-end ${profileOpen ? 'dropdown-open' : ''}`}>
                <button type="button" className="flex items-center gap-2 rounded-full px-2 py-1.5 hover:bg-base-200" aria-label={shell.profileMenu} onClick={() => { setProfileOpen((prev) => !prev); setLanguageOpen(false); setThemeOpen(false) }}>
                  <img src={avatarPlaceholder} alt={user?.username ?? shell.avatarAlt} className="h-9 w-9 rounded-full border border-base-300 object-cover" />
                  <span className="hidden text-sm font-semibold text-base-content sm:inline">{user?.username}</span>
                  <ChevronDown className="hidden h-4 w-4 text-base-content/60 sm:inline" />
                </button>
                <ul className="dropdown-content menu mt-2 w-52 rounded-xl border border-base-content/10 bg-base-100 p-2 shadow-xl">
                  <li className="menu-title px-3 py-1 text-xs text-base-content/60">{shell.signedInAs}: {user?.username}</li>
                  <li><button type="button" disabled={isTestingHello} onClick={() => void handleTestHello()}>{isTestingHello ? shell.testing : shell.testHello}</button></li>
                  <li><button type="button" onClick={() => void handleLogout()}>{shell.signOut}</button></li>
                </ul>
              </div>
            </div>
          </header>

          <div className="px-4 py-6 md:px-8">
            <h1 className="text-3xl font-bold text-base-content">{title}</h1>
            <p className="text-base-content/70">{layout.welcome} {subtitle}</p>
            {children ? <div className="mt-6">{children}</div> : null}
          </div>
        </div>
      </section>
    </main>
  )
}
