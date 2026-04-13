import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Bell, CircleUserRound, Globe, LogOut, Menu, Monitor, Moon, Settings, Shield, Sun, User, CircleHelp, BellRing } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks.js'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import type { Language } from '../../../i18n/language'
import logoLight from '../../../assets/logo_light.svg'
import logoDark from '../../../assets/logo_dark.svg'

interface DashboardShellProps {
  language: Language
  setLanguage: (language: Language) => void
  themePreference: 'system' | 'light' | 'dark'
  resolvedTheme: 'drivio-light' | 'drivio-dark'
  setThemePreference: (theme: 'system' | 'light' | 'dark') => void
  navItems: Array<{ label: string; icon?: ReactNode; to: string }>
}

export default function DashboardShell({
  language,
  setLanguage,
  themePreference,
  resolvedTheme,
  setThemePreference,
  navItems,
}: DashboardShellProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState<number>(() => {
    const raw = localStorage.getItem('drivio_unread_notifications')
    return raw ? Number(raw) || 0 : 0
  })
  const profileRef = useRef<HTMLDivElement | null>(null)
  const languageRef = useRef<HTMLDivElement | null>(null)
  const themeRef = useRef<HTMLDivElement | null>(null)

  const t = getDashboardTranslations(language)
  const shell = t.shell
  const common = t.common

  const memoNavItems = useMemo(() => navItems, [navItems])
  const roleSegment = user?.role === 'SUPERADMIN'
    ? 'superadmin'
    : user?.role === 'SCHOOLADMIN'
      ? 'schooladmin'
      : user?.role === 'INSTRUCTOR'
        ? 'instructor'
        : 'student'

  const profileMenuItems = [
    { label: 'Profile', to: `/dashboard/${roleSegment}/profile`, icon: User },
    { label: 'Settings', to: `/dashboard/${roleSegment}/settings`, icon: Settings },
    { label: 'Notifications', to: `/dashboard/${roleSegment}/notifications`, icon: BellRing },
    { label: 'Security', to: `/dashboard/${roleSegment}/security`, icon: Shield },
    ...(user?.role === 'SUPERADMIN' ? [] : [{ label: 'FAQs', to: `/dashboard/${roleSegment}/faqs`, icon: CircleHelp }]),
  ] as const

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
        setMobileNavOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ title?: string; body?: string }>
      const title = customEvent.detail?.title ?? 'New notification'
      const body = customEvent.detail?.body ?? ''

      setUnreadNotifications((prev) => {
        const next = prev + 1
        localStorage.setItem('drivio_unread_notifications', String(next))
        return next
      })

      if ('serviceWorker' in navigator && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          void navigator.serviceWorker.ready.then((registration) =>
            registration.showNotification(title, {
              body,
              icon: '/pwa-dark-192x192.png',
              badge: '/pwa-dark-192x192.png',
            }),
          )
        } else if (Notification.permission !== 'denied') {
          void Notification.requestPermission()
        }
      }
    }

    window.addEventListener('drivio:support-notification', handler as EventListener)
    return () => window.removeEventListener('drivio:support-notification', handler as EventListener)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // Ignore network/logout response errors and still navigate away.
    }
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-base-100">
      <section className="flex min-h-screen w-full overflow-x-hidden bg-base-100">
        <aside className="hidden w-72 shrink-0 border-r border-base-300 bg-base-200/70 text-base-content lg:block">
          <div className="flex h-20 items-center border-b border-base-300 px-6">
            <img src={resolvedTheme === 'drivio-dark' ? logoDark : logoLight} alt="Drivio" className="h-8 w-auto" />
            <span className="ml-3 text-xl font-semibold">Drivio</span>
          </div>
          <nav className="p-4 space-y-2">
            {memoNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `w-full rounded-xl px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                    isActive ? 'bg-primary text-primary-content font-semibold' : 'text-base-content/80 hover:bg-base-300 hover:text-base-content'
                  }`
                }
              >
                {item.icon ? <span className="inline-flex h-4 w-4 items-center justify-center">{item.icon}</span> : null}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-base-300 bg-base-200/95 text-base-content transition-transform duration-200 lg:hidden ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-20 items-center border-b border-base-300 px-6">
            <img src={resolvedTheme === 'drivio-dark' ? logoDark : logoLight} alt="Drivio" className="h-8 w-auto" />
            <span className="ml-3 text-xl font-semibold">Drivio</span>
          </div>
          <nav className="p-4 space-y-2">
            {memoNavItems.map((item) => (
              <NavLink
                key={`mobile-${item.to}`}
                to={item.to}
                end
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  `w-full rounded-xl px-4 py-3 text-left text-sm transition-colors flex items-center gap-2 ${
                    isActive ? 'bg-primary text-primary-content font-semibold' : 'text-base-content/80 hover:bg-base-300 hover:text-base-content'
                  }`
                }
              >
                {item.icon ? <span className="inline-flex h-4 w-4 items-center justify-center">{item.icon}</span> : null}
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-[clamp(3.5rem,9vmin,5rem)] items-center justify-between border-b border-base-300 bg-base-100 px-[clamp(0.5rem,2vmin,0.75rem)] sm:px-4 md:px-8">
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm lg:hidden"
                aria-label="Toggle menu"
                onClick={() => setMobileNavOpen((prev) => !prev)}
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>

            <div className="ml-2 flex items-center self-center gap-[clamp(0.375rem,1.3vmin,0.75rem)]">
              <div ref={themeRef} className={`dropdown dropdown-end ${themeOpen ? 'dropdown-open' : ''}`}>
                <button type="button" className="btn btn-ghost btn-circle h-[clamp(2rem,5.2vmin,2.5rem)] min-h-0 w-[clamp(2rem,5.2vmin,2.5rem)]" aria-label={common.changeTheme} onClick={() => { setThemeOpen((prev) => !prev); setLanguageOpen(false); setProfileOpen(false) }}>
                  {themePreference === 'system' ? <Monitor className="h-[clamp(1rem,2.3vmin,1.3rem)] w-[clamp(1rem,2.3vmin,1.3rem)]" /> : resolvedTheme === 'drivio-dark' ? <Moon className="h-[clamp(1rem,2.3vmin,1.3rem)] w-[clamp(1rem,2.3vmin,1.3rem)]" /> : <Sun className="h-[clamp(1rem,2.3vmin,1.3rem)] w-[clamp(1rem,2.3vmin,1.3rem)]" />}
                </button>
                <ul className="dropdown-content menu mt-2 w-44 rounded-xl border border-base-content/10 bg-base-100 p-2 shadow-xl">
                  <li><button onClick={() => { setThemePreference('system'); setThemeOpen(false) }} className={themePreference === 'system' ? 'active' : ''}><Monitor className="h-4 w-4" /> {common.themeSystem}</button></li>
                  <li><button onClick={() => { setThemePreference('light'); setThemeOpen(false) }} className={themePreference === 'light' ? 'active' : ''}><Sun className="h-4 w-4" /> {common.themeLight}</button></li>
                  <li><button onClick={() => { setThemePreference('dark'); setThemeOpen(false) }} className={themePreference === 'dark' ? 'active' : ''}><Moon className="h-4 w-4" /> {common.themeDark}</button></li>
                </ul>
              </div>

              <div ref={languageRef} className={`dropdown dropdown-end ${languageOpen ? 'dropdown-open' : ''}`}>
                <button type="button" className="btn btn-ghost btn-circle h-[clamp(2rem,5.2vmin,2.5rem)] min-h-0 w-[clamp(2rem,5.2vmin,2.5rem)]" aria-label={common.changeLanguage} onClick={() => { setLanguageOpen((prev) => !prev); setThemeOpen(false); setProfileOpen(false) }}>
                  <Globe className="h-[clamp(1rem,2.3vmin,1.3rem)] w-[clamp(1rem,2.3vmin,1.3rem)]" />
                </button>
                <ul className="dropdown-content menu mt-2 w-32 rounded-xl border border-base-content/10 bg-base-100 p-2 shadow-xl">
                  <li><button onClick={() => { setLanguage('bg'); setLanguageOpen(false) }} className={language === 'bg' ? 'active' : ''}>BG</button></li>
                  <li><button onClick={() => { setLanguage('en'); setLanguageOpen(false) }} className={language === 'en' ? 'active' : ''}>EN</button></li>
                </ul>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-circle relative h-[clamp(2rem,5.2vmin,2.5rem)] min-h-0 w-[clamp(2rem,5.2vmin,2.5rem)]"
                aria-label={shell.notifications}
                onClick={() => {
                  setUnreadNotifications(0)
                  localStorage.setItem('drivio_unread_notifications', '0')
                }}
              >
                <Bell className="h-[clamp(1rem,2.3vmin,1.3rem)] w-[clamp(1rem,2.3vmin,1.3rem)]" />
                {unreadNotifications > 0 ? <span className="badge badge-xs badge-primary absolute -right-0.5 -top-0.5">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span> : null}
              </button>

              <div ref={profileRef} className={`dropdown dropdown-end ${profileOpen ? 'dropdown-open' : ''}`}>
                <button type="button" className="rounded-full p-0.5 transition-colors hover:bg-base-200/70" aria-label={shell.profileMenu} onClick={() => { setProfileOpen((prev) => !prev); setLanguageOpen(false); setThemeOpen(false) }}>
                  <span className="flex h-[clamp(2.1rem,5.6vmin,2.6rem)] w-[clamp(2.1rem,5.6vmin,2.6rem)] items-center justify-center rounded-full border border-base-300 bg-base-200">
                    <CircleUserRound className="h-[clamp(1.2rem,2.8vmin,1.5rem)] w-[clamp(1.2rem,2.8vmin,1.5rem)] text-base-content/70" />
                  </span>
                </button>
                <div className="dropdown-content mt-2 w-72 rounded-2xl border border-base-content/15 bg-base-100 p-0 shadow-2xl">
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full border border-base-300 bg-base-200">
                        <CircleUserRound className="h-5 w-5 text-base-content/70" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-base-content">{user?.username}</p>
                        <p className="truncate text-xs text-base-content/60">{user?.role}</p>
                      </div>
                    </div>
                  </div>

                  <hr className="mx-3 my-0 border-0 border-t border-base-content/20" />

                  <div className="py-1">
                    {profileMenuItems.map((item) => (
                      <button
                        key={item.to}
                        type="button"
                        className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-base-content transition-colors hover:bg-base-200/70"
                        onClick={() => {
                          navigate(item.to)
                          setProfileOpen(false)
                        }}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <hr className="mx-3 my-0 border-0 border-t border-base-content/20" />

                  <div className="py-1.5">
                    <button type="button" className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-error transition-colors hover:bg-error/10" onClick={() => void handleLogout()}>
                      <LogOut className="h-4 w-4" />
                      {shell.signOut}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="px-3 py-5 sm:px-4 md:px-8">
            <Outlet />
          </div>
        </div>
      </section>
    </main>
  )
}
