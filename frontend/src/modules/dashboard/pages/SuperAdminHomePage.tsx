import { useCallback, useEffect, useMemo, useState } from 'react'
import { BellRing, Clock3, LifeBuoy, Mail, MoveRight, RefreshCw, ShieldCheck, Sparkles, Ticket, UserRoundPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { fetchMyNotifications, fetchPendingSchoolJoinRequests, fetchSupportThreadsForAdmin, type DashboardNotification, type SchoolJoinRequest, type SupportThread } from '../api'
import type { Language } from '../../../i18n/language'
import { useDashboardShell } from '../hooks'

interface Props {
  language: Language
}

type HomePanel = 'requests' | 'support' | 'notifications'

function formatDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === 'bg' ? 'bg-BG' : 'en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getNotificationLabel(item: DashboardNotification, language: Language) {
  const map: Record<string, { bg: string; en: string }> = {
    SUPPORT_TICKET_CREATED: { bg: 'Нов тикет', en: 'New ticket' },
    SUPPORT_STATUS: { bg: 'Статус на тикет', en: 'Ticket status' },
    SUPPORT_TICKET_DELETED: { bg: 'Изтрит тикет', en: 'Deleted ticket' },
    SUPPORT_REPLY: { bg: 'Нов отговор', en: 'New reply' },
    LESSON_START_REQUESTED: { bg: 'Старт на урок', en: 'Lesson start' },
    GENERAL: { bg: 'Системно', en: 'System' },
  }

  const copy = map[item.type] ?? map.GENERAL
  return language === 'bg' ? copy.bg : copy.en
}

export default function SuperAdminHomePage({ language }: Props) {
  const { pushToast } = useDashboardShell()
  const [requests, setRequests] = useState<SchoolJoinRequest[]>([])
  const [threads, setThreads] = useState<SupportThread[]>([])
  const [notifications, setNotifications] = useState<DashboardNotification[]>([])
  const [activePanel, setActivePanel] = useState<HomePanel>('requests')
  const [isLoading, setIsLoading] = useState(true)
  const [isManualRefreshing, setIsManualRefreshing] = useState(false)

  const copy = {
    title: language === 'bg' ? 'Начало' : 'Home',
    subtitle:
      language === 'bg'
        ? 'Жив преглед на реалния поток през платформата: заявки, поддръжка и известия.'
        : 'A live view of the actual platform flow: requests, support, and notifications.',
    refresh: language === 'bg' ? 'Обнови' : 'Refresh',
    attentionNow: language === 'bg' ? 'Нужно внимание сега' : 'Needs attention now',
    activityFeed: language === 'bg' ? 'Оперативен изглед' : 'Operational view',
    quickActions: language === 'bg' ? 'Бързи действия' : 'Quick actions',
    recentNotifications: language === 'bg' ? 'Последни известия' : 'Recent notifications',
    pendingRequests: language === 'bg' ? 'Чакащи заявки' : 'Pending requests',
    openTickets: language === 'bg' ? 'Отворени тикети' : 'Open tickets',
    waitingUsers: language === 'bg' ? 'Чакат потребител' : 'Waiting on user',
    unreadNotifications: language === 'bg' ? 'Непрочетени известия' : 'Unread notifications',
    latestRequests: language === 'bg' ? 'Последни заявки' : 'Latest requests',
    supportQueue: language === 'bg' ? 'Опашка за поддръжка' : 'Support queue',
    emptyRequests: language === 'bg' ? 'Няма чакащи заявки за одобрение.' : 'There are no pending requests to approve.',
    emptySupport: language === 'bg' ? 'Няма активни тикети в момента.' : 'There are no active tickets right now.',
    emptyNotifications: language === 'bg' ? 'Няма нови известия.' : 'There are no new notifications.',
    noAddress: language === 'bg' ? 'Без адрес' : 'No address',
    noPreview: language === 'bg' ? 'Няма преглед на съобщение.' : 'No message preview.',
    statusOpen: language === 'bg' ? 'Отворен' : 'Open',
    statusWaiting: language === 'bg' ? 'Чака потребител' : 'Waiting user',
    statusClosed: language === 'bg' ? 'Затворен' : 'Closed',
    sourcePublic: language === 'bg' ? 'Уеб/имейл' : 'Web/email',
    sourceDashboard: language === 'bg' ? 'Платформа' : 'Platform',
    sourceEmail: language === 'bg' ? 'Имейл' : 'Email',
    requestsAction: language === 'bg' ? 'Към заявките' : 'Open requests',
    supportAction: language === 'bg' ? 'Към поддръжката' : 'Open support',
    notificationsAction: language === 'bg' ? 'Известия' : 'Open notifications',
    requestContact: language === 'bg' ? 'Контакт' : 'Contact',
    viewAll: language === 'bg' ? 'Виж всички' : 'View all',
    retry: language === 'bg' ? 'Опитай отново' : 'Try again',
    error: language === 'bg' ? 'Неуспешно зареждане на началното табло.' : 'Failed to load the home dashboard.',
  }

  const loadHomeData = useCallback(async (options?: { silent?: boolean; showRefreshIndicator?: boolean }) => {
    const isSilent = Boolean(options?.silent)
    const showRefreshIndicator = Boolean(options?.showRefreshIndicator)

    if (!isSilent) {
      setIsLoading(true)
    }
    if (showRefreshIndicator) {
      setIsManualRefreshing(true)
    }

    try {
      const [pendingRequests, supportThreads, notificationData] = await Promise.all([
        fetchPendingSchoolJoinRequests(),
        fetchSupportThreadsForAdmin(),
        fetchMyNotifications(8),
      ])

      setRequests(pendingRequests)
      setThreads(supportThreads)
      setNotifications(notificationData.items)
    } catch {
      if (!isSilent) {
        pushToast('error', copy.error)
      }
    } finally {
      if (!isSilent) {
        setIsLoading(false)
      }
      if (showRefreshIndicator) {
        setIsManualRefreshing(false)
      }
    }
  }, [copy.error, pushToast])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadHomeData()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadHomeData])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadHomeData({ silent: true })
    }, 15000)

    return () => window.clearInterval(interval)
  }, [loadHomeData])

  const openTickets = useMemo(() => threads.filter((thread) => thread.status === 'OPEN'), [threads])
  const waitingUserTickets = useMemo(() => threads.filter((thread) => thread.status === 'WAITING_USER'), [threads])
  const unreadNotifications = useMemo(() => notifications.filter((item) => !item.read), [notifications])

  const spotlightItems = [
    {
      key: 'requests' as const,
      label: copy.pendingRequests,
      value: requests.length,
      tone: 'from-[#4f46e5]/20 via-[#2563eb]/10 to-transparent',
      border: 'border-[#4f46e5]/25',
      icon: <UserRoundPlus className="h-5 w-5" />,
      href: '/dashboard/superadmin/requests',
    },
    {
      key: 'support' as const,
      label: copy.openTickets,
      value: openTickets.length,
      tone: 'from-[#0f766e]/20 via-[#14b8a6]/10 to-transparent',
      border: 'border-[#0f766e]/25',
      icon: <LifeBuoy className="h-5 w-5" />,
      href: '/dashboard/superadmin/support',
    },
    {
      key: 'notifications' as const,
      label: copy.unreadNotifications,
      value: unreadNotifications.length,
      tone: 'from-[#f59e0b]/25 via-[#f97316]/10 to-transparent',
      border: 'border-[#f59e0b]/25',
      icon: <BellRing className="h-5 w-5" />,
      href: '/dashboard/superadmin/notifications',
    },
    {
      key: 'support' as const,
      label: copy.waitingUsers,
      value: waitingUserTickets.length,
      tone: 'from-[#be185d]/20 via-[#ec4899]/10 to-transparent',
      border: 'border-[#be185d]/25',
      icon: <Clock3 className="h-5 w-5" />,
      href: '/dashboard/superadmin/support',
    },
  ]

  const quickActions = [
    {
      title: copy.requestsAction,
      description: language === 'bg' ? 'Преглед и одобряване на нови автошколи.' : 'Review and approve new driving schools.',
      href: '/dashboard/superadmin/requests',
      icon: <UserRoundPlus className="h-4 w-4" />,
    },
    {
      title: copy.supportAction,
      description: language === 'bg' ? 'Обработване на текущите тикети и разговори.' : 'Handle active tickets and conversations.',
      href: '/dashboard/superadmin/support',
      icon: <Ticket className="h-4 w-4" />,
    },
    {
      title: copy.notificationsAction,
      description: language === 'bg' ? 'Преглед на известията, които системата е изпратила.' : 'Review the notifications emitted by the system.',
      href: '/dashboard/superadmin/notifications',
      icon: <BellRing className="h-4 w-4" />,
    },
  ]

  const requestRows = requests.slice(0, 4)
  const supportRows = threads.filter((thread) => thread.status !== 'CLOSED').slice(0, 4)
  const notificationRows = notifications.slice(0, 5)

  const statusLabel = (status: SupportThread['status']) => {
    if (status === 'WAITING_USER') return copy.statusWaiting
    if (status === 'CLOSED') return copy.statusClosed
    return copy.statusOpen
  }

  const sourceLabel = (source: SupportThread['source']) => {
    if (source === 'USER_DASHBOARD') return copy.sourceDashboard
    if (source === 'EMAIL') return copy.sourceEmail
    return copy.sourcePublic
  }

  return (
    <section className="space-y-4 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-3 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)] sm:p-5 lg:p-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(22rem,0.95fr)]">
        <div className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100 px-3 py-1 text-xs font-semibold text-base-content/75">
                <Sparkles className="h-3.5 w-3.5" />
                {copy.attentionNow}
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-tight text-base-content sm:text-2xl">{copy.title}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-base-content/70 sm:text-base">{copy.subtitle}</p>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline h-10 w-full rounded-xl md:w-auto"
              onClick={() => void loadHomeData({ silent: true, showRefreshIndicator: true })}
              disabled={isManualRefreshing}
            >
              <span>{copy.refresh}</span>
              <RefreshCw className={`h-4 w-4 ${isManualRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {spotlightItems.map((item) => (
              <Link
                key={`${item.key}-${item.label}`}
                to={item.href}
                className="rounded-xl border border-base-300/80 bg-base-100 p-4 shadow-sm transition-colors hover:bg-base-200/60"
                onMouseEnter={() => setActivePanel(item.key)}
                onFocus={() => setActivePanel(item.key)}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex rounded-xl bg-base-200 p-2.5 text-base-content/85">
                    {item.icon}
                  </span>
                  <MoveRight className="h-4 w-4 text-base-content/35" />
                </div>
                <p className="mt-6 text-2xl font-semibold tracking-tight text-base-content">{item.value}</p>
                <p className="mt-1 text-sm text-base-content/70">{item.label}</p>
              </Link>
            ))}
          </div>
        </div>

        <aside className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/55">{copy.quickActions}</p>
              <h3 className="mt-2 text-xl font-semibold text-base-content">{copy.activityFeed}</h3>
            </div>
            <span className="inline-flex rounded-full border border-base-300 bg-base-100 px-3 py-1 text-xs font-medium text-base-content/70">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              Drivio
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {quickActions.map((action) => (
              <Link key={action.href} to={action.href} className="flex items-start gap-3 rounded-xl border border-base-300/80 bg-base-100 p-4 transition-colors hover:bg-base-200/60">
                <span className="mt-0.5 inline-flex rounded-lg bg-base-200 p-2 text-base-content/75">{action.icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-base-content">{action.title}</p>
                  <p className="mt-1 text-xs leading-5 text-base-content/65">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-base-300/80 bg-base-100 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-base-content">{copy.recentNotifications}</p>
                <p className="mt-1 text-xs text-base-content/60">{language === 'bg' ? 'Последните системни събития към вашия профил.' : 'Latest system events delivered to your profile.'}</p>
              </div>
              <BellRing className="h-4 w-4 text-base-content/45" />
            </div>
            <div className="mt-4 space-y-2">
              {notificationRows.length === 0 ? (
                <p className="rounded-xl border border-dashed border-base-300 px-3 py-4 text-sm text-base-content/55">{copy.emptyNotifications}</p>
              ) : (
                notificationRows.slice(0, 3).map((item) => (
                  <div key={item.id} className="rounded-xl border border-base-300/80 bg-base-100 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`badge badge-sm ${item.read ? 'badge-ghost' : 'badge-primary'}`}>{getNotificationLabel(item, language)}</span>
                      <span className="text-[11px] text-base-content/45">{formatDate(item.createdAt, language)}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-base-content/75">{item.title || item.body || (language === 'bg' ? 'Системно известие' : 'System notification')}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/55">{copy.activityFeed}</p>
              <h3 className="mt-2 text-xl font-semibold text-base-content">
                {activePanel === 'support' ? copy.supportQueue : activePanel === 'notifications' ? copy.recentNotifications : copy.latestRequests}
              </h3>
            </div>
            <div className="tabs tabs-boxed border border-base-content/10 bg-base-200/70 p-1">
              <button type="button" className={`tab ${activePanel === 'requests' ? 'tab-active' : ''}`} onClick={() => setActivePanel('requests')}>{copy.pendingRequests}</button>
              <button type="button" className={`tab ${activePanel === 'support' ? 'tab-active' : ''}`} onClick={() => setActivePanel('support')}>{copy.openTickets}</button>
              <button type="button" className={`tab ${activePanel === 'notifications' ? 'tab-active' : ''}`} onClick={() => setActivePanel('notifications')}>{copy.unreadNotifications}</button>
            </div>
          </div>

          <div className="mt-5">
            {isLoading ? (
              <div className="space-y-3">
                <div className="skeleton h-20 w-full rounded-2xl" />
                <div className="skeleton h-20 w-full rounded-2xl" />
                <div className="skeleton h-20 w-full rounded-2xl" />
              </div>
            ) : null}

            {!isLoading && activePanel === 'requests' ? (
              <div className="space-y-3">
                {requestRows.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-base-300 bg-base-100/60 px-4 py-8 text-center text-sm text-base-content/55">
                    {copy.emptyRequests}
                  </div>
                ) : (
                  requestRows.map((request) => (
                    <article key={request.id} className="rounded-xl border border-base-300/80 bg-base-100 p-4 transition-colors hover:bg-base-200/60">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-base-content">{request.schoolName}</p>
                          <p className="mt-1 text-sm text-base-content/65">{request.schoolAddress || copy.noAddress}</p>
                          <p className="mt-2 text-xs text-base-content/55">{copy.requestContact}: {request.contactName} · {request.contactEmail}</p>
                        </div>
                        <div className="shrink-0 text-left md:text-right">
                          <p className="text-xs font-medium text-base-content/45">{formatDate(request.createdAt, language)}</p>
                          <Link to="/dashboard/superadmin/requests" className="btn btn-ghost btn-sm mt-2 rounded-xl">{copy.requestsAction}</Link>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            ) : null}

            {!isLoading && activePanel === 'support' ? (
              <div className="space-y-3">
                {supportRows.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-base-300 bg-base-100/60 px-4 py-8 text-center text-sm text-base-content/55">
                    {copy.emptySupport}
                  </div>
                ) : (
                  supportRows.map((thread) => (
                    <article key={thread.id} className="rounded-xl border border-base-300/80 bg-base-100 p-4 transition-colors hover:bg-base-200/60">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-base font-semibold text-base-content">{thread.ticketSubject?.trim() || `Ticket #${thread.id.slice(0, 8)}`}</p>
                            <span className={`badge badge-sm ${thread.status === 'OPEN' ? 'badge-success' : 'badge-warning'}`}>{statusLabel(thread.status)}</span>
                          </div>
                          <p className="mt-1 text-sm text-base-content/65">{thread.requesterName} · {sourceLabel(thread.source)}</p>
                          <p className="mt-2 line-clamp-2 text-sm text-base-content/60">{thread.latestMessagePreview || copy.noPreview}</p>
                        </div>
                        <div className="shrink-0 text-left md:text-right">
                          <p className="text-xs font-medium text-base-content/45">{formatDate(thread.updatedAt, language)}</p>
                          <Link to="/dashboard/superadmin/support" className="btn btn-ghost btn-sm mt-2 rounded-xl">{copy.supportAction}</Link>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            ) : null}

            {!isLoading && activePanel === 'notifications' ? (
              <div className="space-y-3">
                {notificationRows.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-base-300 bg-base-100/60 px-4 py-8 text-center text-sm text-base-content/55">
                    {copy.emptyNotifications}
                  </div>
                ) : (
                  notificationRows.map((item) => (
                    <article key={item.id} className="rounded-xl border border-base-300/80 bg-base-100 p-4 transition-colors hover:bg-base-200/60">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`badge badge-sm ${item.read ? 'badge-ghost' : 'badge-primary'}`}>{getNotificationLabel(item, language)}</span>
                            {!item.read ? <span className="text-xs font-medium text-primary">{language === 'bg' ? 'Ново' : 'New'}</span> : null}
                          </div>
                          <p className="mt-2 text-sm font-medium text-base-content">{item.title || (language === 'bg' ? 'Системно известие' : 'System notification')}</p>
                          {item.body ? <p className="mt-1 line-clamp-2 text-sm text-base-content/60">{item.body}</p> : null}
                        </div>
                        <div className="shrink-0 text-left md:text-right">
                          <p className="text-xs font-medium text-base-content/45">{formatDate(item.createdAt, language)}</p>
                          <Link to="/dashboard/superadmin/notifications" className="btn btn-ghost btn-sm mt-2 rounded-xl">{copy.notificationsAction}</Link>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/55">{copy.supportQueue}</p>
              <h3 className="mt-2 text-xl font-semibold text-base-content">{copy.recentNotifications}</h3>
            </div>
            <Mail className="h-4 w-4 text-base-content/40" />
          </div>

          <div className="mt-5 space-y-3">
            {notificationRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-base-300 bg-base-100/60 px-4 py-8 text-center text-sm text-base-content/55">
                {copy.emptyNotifications}
              </div>
            ) : (
              notificationRows.map((item) => (
                <div key={item.id} className="rounded-xl border border-base-300/80 bg-base-100 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`badge badge-sm ${item.read ? 'badge-ghost' : 'badge-primary'}`}>{getNotificationLabel(item, language)}</span>
                    <span className="text-[11px] text-base-content/45">{formatDate(item.createdAt, language)}</span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-base-content">{item.title || (language === 'bg' ? 'Системно известие' : 'System notification')}</p>
                  {item.body ? <p className="mt-1 text-sm leading-6 text-base-content/60">{item.body}</p> : null}
                </div>
              ))
            )}
          </div>

          <Link to="/dashboard/superadmin/notifications" className="btn btn-ghost btn-sm mt-5 rounded-xl">
            {copy.viewAll}
          </Link>
        </div>
      </div>
    </section>
  )
}
