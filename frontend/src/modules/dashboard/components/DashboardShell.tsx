import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Bell, CircleUserRound, LogOut, Menu, Monitor, Moon, Settings, Shield, Sun, User, CircleHelp, BellRing, X } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks.js'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import type { Language } from '../../../i18n/language'
import logoLight from '../../../assets/logo_light.svg'
import logoDark from '../../../assets/logo_dark.svg'
import { fetchMyNotifications, markAllNotificationsAsRead, savePushSubscription, fetchPushPublicKey, deleteMyNotification, type DashboardNotification } from '../api'
import { getRealtimeSocket } from '../realtime'

export type DashboardNavItem =
  | { kind: 'link'; label: string; icon?: ReactNode; to: string }
  | { kind: 'section'; label: string }
  | { kind: 'divider' }

interface DashboardShellProps {
  language: Language
  setLanguage: (language: Language) => void
  themePreference: 'system' | 'light' | 'dark'
  resolvedTheme: 'drivio-light' | 'drivio-dark'
  setThemePreference: (theme: 'system' | 'light' | 'dark') => void
  navItems: DashboardNavItem[]
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
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<DashboardNotification[]>([])
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>(() => {
    try {
      const raw = sessionStorage.getItem('drivio_dismissed_notifications')
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
    } catch {
      return []
    }
  })
  const [unreadNotifications, setUnreadNotifications] = useState<number>(() => {
    try {
      const raw = sessionStorage.getItem('drivio_unread_notifications')
      return raw ? Number(raw) || 0 : 0
    } catch {
      return 0
    }
  })
  const profileRef = useRef<HTMLDivElement | null>(null)
  const languageRef = useRef<HTMLDivElement | null>(null)
  const themeRef = useRef<HTMLDivElement | null>(null)
  const notificationsRef = useRef<HTMLDivElement | null>(null)
  const notificationsSyncInFlight = useRef(false)

  const t = getDashboardTranslations(language)
  const shell = t.shell
  const common = t.common
  const topBarHeightClass = 'h-[clamp(3.5rem,9vmin,5rem)]'
  const isBg = language === 'bg'

  const notificationCopyByType = useMemo(
    () => ({
      SUPPORT_TICKET_CREATED: {
        title: shell.notificationTypes.ticketCreatedTitle,
        body: shell.notificationTypes.ticketCreatedBody,
      },
      SUPPORT_STATUS: {
        title: shell.notificationTypes.ticketStatusTitle,
        body: shell.notificationTypes.ticketStatusBody,
      },
      SUPPORT_TICKET_DELETED: {
        title: shell.notificationTypes.ticketDeletedTitle,
        body: shell.notificationTypes.ticketDeletedBody,
      },
      SUPPORT_REPLY: {
        title: shell.notificationTypes.supportReplyTitle,
        body: shell.notificationTypes.supportReplyBody,
      },
      GENERAL: {
        title: shell.notificationTypes.generalTitle,
        body: shell.notificationTypes.generalBody,
      },
    }),
    [shell.notificationTypes],
  )

  const getNotificationContent = (item: DashboardNotification) => {
    const fallback = notificationCopyByType.GENERAL
    const fromType = notificationCopyByType[item.type as keyof typeof notificationCopyByType] ?? fallback
    return {
      title: item.title?.trim() ? item.title : fromType.title,
      body: item.body?.trim() ? item.body : fromType.body,
    }
  }

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString)
    const locale = isBg ? 'bg-BG' : 'en-US'
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    }).format(date)
  }

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => !dismissedNotificationIds.includes(item.id)),
    [notifications, dismissedNotificationIds],
  )

  const syncNotifications = async () => {
    if (notificationsSyncInFlight.current) return
    notificationsSyncInFlight.current = true
    try {
      const data = await fetchMyNotifications()
      setNotifications(data.items)
      setUnreadNotifications(data.unreadCount)
      sessionStorage.setItem('drivio_unread_notifications', String(data.unreadCount))
    } catch {
      // no-op
    } finally {
      notificationsSyncInFlight.current = false
    }
  }

  const memoNavItems = useMemo(() => navItems, [navItems])
  const roleSegment = user?.role === 'SUPERADMIN'
    ? 'superadmin'
    : user?.role === 'SCHOOLADMIN'
      ? 'schooladmin'
      : user?.role === 'INSTRUCTOR'
        ? 'instructor'
        : 'student'

  const profileMenuItems = [
    { label: shell.profile, to: `/dashboard/${roleSegment}/profile`, icon: User },
    { label: shell.settings, to: `/dashboard/${roleSegment}/settings`, icon: Settings },
    { label: shell.notifications, to: `/dashboard/${roleSegment}/notifications`, icon: BellRing },
    { label: shell.security, to: `/dashboard/${roleSegment}/security`, icon: Shield },
    ...(user?.role === 'SUPERADMIN' ? [] : [{ label: shell.faqs, to: `/dashboard/${roleSegment}/faqs`, icon: CircleHelp }]),
  ] as const

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false)
      if (languageRef.current && !languageRef.current.contains(target)) setLanguageOpen(false)
      if (themeRef.current && !themeRef.current.contains(target)) setThemeOpen(false)
      if (notificationsRef.current && !notificationsRef.current.contains(target)) setNotificationsOpen(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileOpen(false)
        setLanguageOpen(false)
        setThemeOpen(false)
        setMobileNavOpen(false)
        setNotificationsOpen(false)
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
    const load = async () => {
      await syncNotifications()
    }
    void load()
  }, [])

  useEffect(() => {
    const socket = getRealtimeSocket()

    const onNotification = (item: DashboardNotification) => {
      setNotifications((prev) => [item, ...prev].slice(0, 30))
      setUnreadNotifications((prev) => {
        const next = prev + 1
        sessionStorage.setItem('drivio_unread_notifications', String(next))
        return next
      })

      if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
        const content = getNotificationContent(item)
        void navigator.serviceWorker.ready.then((registration) =>
          registration.showNotification(content.title, {
            body: content.body,
            icon: '/pwa-dark-192x192.png',
            badge: '/pwa-dark-192x192.png',
          }),
        )
      }
    }

    socket.on('notification:new', onNotification)
    socket.on('support:thread-updated', syncNotifications)
    socket.on('support:thread-deleted', syncNotifications)
    return () => {
      socket.off('notification:new', onNotification)
      socket.off('support:thread-updated', syncNotifications)
      socket.off('support:thread-deleted', syncNotifications)
    }
  }, [getNotificationContent])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void syncNotifications()
    }, 6000)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void syncNotifications()
      }
    }

    window.addEventListener('focus', onVisibility)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', onVisibility)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    const registerPush = async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return
        const registration = await navigator.serviceWorker.ready
        let subscription = await registration.pushManager.getSubscription()
        if (!subscription) {
          const publicKey = await fetchPushPublicKey()
          const converted = Uint8Array.from(atob(publicKey.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))
          subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: converted })
        }
        const json = subscription.toJSON()
        if (json.endpoint && json.keys?.auth && json.keys?.p256dh) {
          await savePushSubscription(json)
        }
      } catch {
        // no-op
      }
    }
    void registerPush()
  }, [])

  const openNotifications = async () => {
    setNotificationsOpen((prev) => !prev)
    setProfileOpen(false)
    setLanguageOpen(false)
    setThemeOpen(false)

    if (unreadNotifications > 0) {
      setUnreadNotifications(0)
      sessionStorage.setItem('drivio_unread_notifications', '0')
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
      try {
        await markAllNotificationsAsRead()
      } catch {
        // no-op
      }
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // Ignore network/logout response errors and still navigate away.
    }
    navigate('/login', { replace: true })
  }

  const dismissNotification = async (id: string) => {
    try {
      await deleteMyNotification(id)
      setNotifications((prev) => prev.filter((item) => item.id !== id))
      setDismissedNotificationIds((prev) => {
        const next = prev.filter((itemId) => itemId !== id)
        sessionStorage.setItem('drivio_dismissed_notifications', JSON.stringify(next))
        return next
      })
      setUnreadNotifications((prev) => Math.max(0, prev - 1))
    } catch {
      // no-op
    }
  }

  return (
    <main className="h-screen overflow-hidden overflow-x-hidden bg-base-200/35">
      <section className="dashboard-shell flex h-screen w-full bg-base-100">
        <aside className="hidden min-h-0 w-72 shrink-0 border-r border-base-300 bg-base-200/70 text-base-content xl:flex xl:flex-col">
          <div className={`flex ${topBarHeightClass} items-center border-b border-base-300 px-6`}>
            <img src={resolvedTheme === 'drivio-dark' ? logoDark : logoLight} alt="Drivio" className="h-8 w-auto" />
            <span className="ml-3 text-xl font-semibold">Drivio</span>
          </div>
          <nav className="min-h-0 flex-1 space-y-2 p-4">
            {memoNavItems.map((item, index) =>
              item.kind === 'section' ? (
                <p key={`section-${index}-${item.label}`} className="px-2 pt-3 text-[11px] font-semibold uppercase tracking-wide text-base-content/55">
                  {item.label}
                </p>
              ) : item.kind === 'divider' ? (
                <hr key={`divider-${index}`} className="mx-2 my-2 border-0 border-t border-base-content/15" />
              ) : (
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
              ),
            )}
          </nav>
        </aside>

        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/40 xl:hidden"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-base-300 bg-base-200/95 text-base-content transition-transform duration-200 xl:hidden ${
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className={`flex ${topBarHeightClass} items-center border-b border-base-300 px-6`}>
            <img src={resolvedTheme === 'drivio-dark' ? logoDark : logoLight} alt="Drivio" className="h-8 w-auto" />
            <span className="ml-3 text-xl font-semibold">Drivio</span>
          </div>
          <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
            {memoNavItems.map((item, index) =>
              item.kind === 'section' ? (
                <p key={`mobile-section-${index}-${item.label}`} className="px-2 pt-3 text-[11px] font-semibold uppercase tracking-wide text-base-content/55">
                  {item.label}
                </p>
              ) : item.kind === 'divider' ? (
                <hr key={`mobile-divider-${index}`} className="mx-2 my-2 border-0 border-t border-base-content/15" />
              ) : (
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
              ),
            )}
          </nav>
        </aside>

        <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
          <header className={`flex ${topBarHeightClass} items-center justify-between border-b border-base-300/80 bg-base-100/95 px-[clamp(0.5rem,2vmin,0.75rem)] sm:px-4 md:px-8`}>
            <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm xl:hidden"
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
                  <span className="text-[clamp(0.68rem,1.7vmin,0.82rem)] font-semibold tracking-wide">
                    {language === 'bg' ? 'BG' : 'EN'}
                  </span>
                </button>
                <ul className="dropdown-content menu mt-2 w-32 rounded-xl border border-base-content/10 bg-base-100 p-2 shadow-xl">
                  <li><button onClick={() => { setLanguage('bg'); setLanguageOpen(false) }} className={language === 'bg' ? 'active' : ''}>BG</button></li>
                  <li><button onClick={() => { setLanguage('en'); setLanguageOpen(false) }} className={language === 'en' ? 'active' : ''}>EN</button></li>
                </ul>
              </div>

              <div ref={notificationsRef} className={`dropdown dropdown-end ${notificationsOpen ? 'dropdown-open' : ''}`}>
                <button
                  type="button"
                  className="btn btn-ghost btn-circle relative h-[clamp(2rem,5.2vmin,2.5rem)] min-h-0 w-[clamp(2rem,5.2vmin,2.5rem)]"
                  aria-label={shell.notifications}
                  onClick={() => void openNotifications()}
                >
                  <Bell className="h-[clamp(1rem,2.3vmin,1.3rem)] w-[clamp(1rem,2.3vmin,1.3rem)]" />
                  {unreadNotifications > 0 ? <span className="badge badge-xs badge-primary absolute -right-0.5 -top-0.5">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span> : null}
                </button>
                <div className="dropdown-content mt-2 w-[min(92vw,24rem)] rounded-2xl border border-base-content/15 bg-base-100 p-2 shadow-2xl">
                  <div className="px-2 py-1.5 text-xs font-semibold text-base-content/70">{shell.notificationsPanelTitle}</div>
                  <div className="max-h-80 overflow-y-auto px-1 py-1">
                    {visibleNotifications.length === 0 ? (
                      <p className="px-2 py-3 text-xs text-base-content/60">{shell.notificationsEmpty}</p>
                    ) : (
                      <div className="space-y-2">
                        {visibleNotifications.map((item) => {
                          const content = getNotificationContent(item)
                          return (
                            <article key={item.id} className={`rounded-xl border px-3 py-2.5 ${item.read ? 'border-base-300 bg-base-100' : 'border-primary/35 bg-primary/10'}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-base-content">{content.title}</p>
                                  <p className="mt-0.5 text-xs text-base-content/70">{content.body}</p>
                                  <p className="mt-1.5 text-[11px] text-base-content/50">{formatNotificationTime(item.createdAt)}</p>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs btn-circle mt-0.5 shrink-0"
                                  aria-label={shell.dismissNotification}
                                  onClick={() => void dismissNotification(item.id)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

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

          <div className="flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-4 sm:py-4 md:px-8">
            <div className="h-full overflow-y-auto rounded-xl border border-base-300/70 bg-base-100/55 p-1 sm:p-2">
              <Outlet />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
