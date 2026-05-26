import { BellRing, ClipboardList, LifeBuoy, TimerReset } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Language } from '../../../i18n/language'
import {
  fetchMyNotifications,
  fetchPendingSchoolJoinRequests,
  fetchSupportThreadsForAdmin,
  type DashboardNotification,
  type SchoolJoinRequest,
  type SupportThread,
} from '../api'
import { useDashboardShell } from '../hooks'

interface Props {
  language: Language
}

export default function SuperAdminStatisticsPage({ language }: Props) {
  const isBg = language === 'bg'
  const { pushToast } = useDashboardShell()
  const [requests, setRequests] = useState<SchoolJoinRequest[]>([])
  const [threads, setThreads] = useState<SupportThread[]>([])
  const [notifications, setNotifications] = useState<DashboardNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [pendingRequests, supportThreads, notificationData] = await Promise.all([
          fetchPendingSchoolJoinRequests(),
          fetchSupportThreadsForAdmin(),
          fetchMyNotifications(50),
        ])
        setRequests(pendingRequests)
        setThreads(supportThreads)
        setNotifications(notificationData.items)
      } catch {
        pushToast('error', isBg ? 'Не успяхме да заредим статистиката.' : 'Failed to load statistics.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const openThreads = useMemo(() => threads.filter((thread) => thread.status === 'OPEN').length, [threads])
  const waitingThreads = useMemo(() => threads.filter((thread) => thread.status === 'WAITING_USER').length, [threads])
  const unreadNotifications = useMemo(() => notifications.filter((item) => !item.read).length, [notifications])

  const stats = [
    {
      label: isBg ? 'Чакащи заявки' : 'Pending requests',
      value: requests.length,
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      label: isBg ? 'Отворени тикети' : 'Open tickets',
      value: openThreads,
      icon: <LifeBuoy className="h-5 w-5" />,
    },
    {
      label: isBg ? 'Чакащи потребител' : 'Waiting on user',
      value: waitingThreads,
      icon: <TimerReset className="h-5 w-5" />,
    },
    {
      label: isBg ? 'Непрочетени известия' : 'Unread notifications',
      value: unreadNotifications,
      icon: <BellRing className="h-5 w-5" />,
    },
  ]

  return (
    <section className="space-y-4 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-5 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)]">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-base-content">
          {isBg ? 'Статистика' : 'Statistics'}
        </h2>
        <p className="mt-2 text-sm text-base-content/70">
          {isBg
            ? 'Актуален преглед на основните operational метрики в платформата.'
            : 'A current overview of the platform’s main operational metrics.'}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-base-300 bg-base-100 p-4">
              <div className="skeleton h-5 w-24 rounded-md" />
              <div className="mt-4 skeleton h-8 w-16 rounded-md" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-xl border border-base-300 bg-base-100 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex rounded-xl bg-base-200 p-2.5 text-base-content/80">
                  {stat.icon}
                </span>
                <span className="text-2xl font-semibold tracking-tight text-base-content">{stat.value}</span>
              </div>
              <p className="mt-4 text-sm text-base-content/70">{stat.label}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
