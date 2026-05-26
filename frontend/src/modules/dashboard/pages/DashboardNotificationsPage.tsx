import { BellRing, CheckCheck, Smartphone, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Language } from '../../../i18n/language'
import {
  deleteMyNotification,
  fetchMyNotifications,
  markAllNotificationsAsRead,
  type DashboardNotification,
} from '../api'
import { useDashboardShell } from '../hooks'
import { getNotificationContent, getNotificationLabel } from '../notification-content'

interface Props {
  language: Language
}

function formatDate(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === 'bg' ? 'bg-BG' : 'en-US', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function DashboardNotificationsPage({ language }: Props) {
  const isBg = language === 'bg'
  const { pushToast } = useDashboardShell()
  const [items, setItems] = useState<DashboardNotification[]>([])
  const [loading, setLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const data = await fetchMyNotifications(50)
      setItems(data.items)
    } catch {
      pushToast('error', isBg ? 'Не успяхме да заредим известията.' : 'Failed to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadNotifications()
  }, [])

  const unreadCount = items.filter((item) => !item.read).length

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true)
    try {
      await markAllNotificationsAsRead()
      setItems((current) => current.map((item) => ({ ...item, read: true })))
      pushToast('success', isBg ? 'Всички известия са маркирани като прочетени.' : 'All notifications were marked as read.')
    } catch {
      pushToast('error', isBg ? 'Не успяхме да обновим известията.' : 'Failed to update notifications.')
    } finally {
      setIsMarkingAll(false)
    }
  }

  const handleDelete = async (notificationId: string) => {
    setDeletingId(notificationId)
    try {
      await deleteMyNotification(notificationId)
      setItems((current) => current.filter((item) => item.id !== notificationId))
      pushToast('success', isBg ? 'Известието е премахнато.' : 'Notification removed.')
    } catch {
      pushToast('error', isBg ? 'Не успяхме да премахнем известието.' : 'Failed to remove notification.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-4 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
            {isBg ? 'Известия' : 'Notifications'}
          </h2>
          <p className="mt-1 text-sm text-base-content/70">
            {isBg
              ? 'Преглед и управление на системните известия към текущия профил.'
              : 'Review and manage the system notifications for the current profile.'}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100/90 px-3 py-1.5 text-sm font-semibold text-base-content shadow-sm">
          <BellRing className="h-4 w-4 text-primary" />
          <span>{unreadCount}</span>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-2xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-base-content">
                {isBg ? 'Последни известия' : 'Recent notifications'}
              </p>
              <p className="text-xs text-base-content/60">
                {isBg ? 'Тук виждате реалните събития, изпратени от платформата.' : 'This list shows the actual events emitted by the platform.'}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline rounded-xl"
              onClick={() => void handleMarkAllRead()}
              disabled={isMarkingAll || unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4" />
              {isBg ? 'Маркирай всички' : 'Mark all'}
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="skeleton h-20 w-full rounded-2xl" />
              <div className="skeleton h-20 w-full rounded-2xl" />
              <div className="skeleton h-20 w-full rounded-2xl" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-base-300 bg-base-100/70 px-4 py-8 text-center">
              <p className="text-sm font-medium text-base-content">
                {isBg ? 'Няма налични известия.' : 'There are no notifications yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const content = getNotificationContent(item, language)
                return (
                  <article key={item.id} className="rounded-xl border border-base-300/80 bg-base-100 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`badge badge-sm ${item.read ? 'badge-ghost' : 'badge-primary'}`}>
                            {getNotificationLabel(item.type, language)}
                          </span>
                          {!item.read ? (
                            <span className="text-xs font-medium text-primary">
                              {isBg ? 'Ново' : 'New'}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-base-content">{content.title}</p>
                        <p className="mt-1 text-sm leading-6 text-base-content/65">{content.body}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-[11px] text-base-content/45">
                          {formatDate(item.createdAt, language)}
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-xs"
                          onClick={() => void handleDelete(item.id)}
                          disabled={deletingId === item.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-medium text-base-content">
            <Smartphone className="h-4 w-4 text-primary" />
            {isBg ? 'Push към устройство' : 'Device push'}
          </p>
          <p className="mt-2 text-xs leading-6 text-base-content/65">
            {isBg
              ? 'Push известията се активират през браузъра и се използват за важни събития като старт на урок, нов отговор от поддръжката и системни промени.'
              : 'Push notifications are enabled through the browser and used for important events such as lesson start, support replies, and system updates.'}
          </p>
        </aside>
      </div>
    </section>
  )
}
