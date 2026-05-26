import { getDashboardTranslations } from '../../i18n/dashboard'
import type { Language } from '../../i18n/language'
import type { DashboardNotification } from './api'

type NotificationLocalizedText = {
  bg?: {
    title?: string
    body?: string
  }
  en?: {
    title?: string
    body?: string
  }
}

function getFallbackContent(type: string, language: Language) {
  const shell = getDashboardTranslations(language).shell

  const map = {
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
    LESSON_START_REQUESTED: {
      title: shell.notificationTypes.lessonStartRequestedTitle,
      body: shell.notificationTypes.lessonStartRequestedBody,
    },
    GENERAL: {
      title: shell.notificationTypes.generalTitle,
      body: shell.notificationTypes.generalBody,
    },
  } as const

  return map[type as keyof typeof map] ?? map.GENERAL
}

function readLocalizedText(metadata: unknown): NotificationLocalizedText | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null
  const candidate = (metadata as Record<string, unknown>).localizedText
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return null
  return candidate as NotificationLocalizedText
}

export function getNotificationContent(notification: DashboardNotification, language: Language) {
  const fallback = getFallbackContent(notification.type, language)
  const localizedText = readLocalizedText(notification.metadata)
  const preferredLocalized = localizedText?.[language]

  return {
    title: preferredLocalized?.title?.trim() || notification.title?.trim() || fallback.title,
    body: preferredLocalized?.body?.trim() || notification.body?.trim() || fallback.body,
  }
}

export function getNotificationLabel(type: string, language: Language) {
  const isBg = language === 'bg'
  const labels: Record<string, string> = {
    SUPPORT_TICKET_CREATED: isBg ? 'Нов тикет' : 'New ticket',
    SUPPORT_STATUS: isBg ? 'Статус на тикет' : 'Ticket status',
    SUPPORT_TICKET_DELETED: isBg ? 'Изтрит тикет' : 'Deleted ticket',
    SUPPORT_REPLY: isBg ? 'Нов отговор' : 'New reply',
    LESSON_START_REQUESTED: isBg ? 'Старт на урок' : 'Lesson start',
    GENERAL: isBg ? 'Системно' : 'System',
  }

  return labels[type] ?? labels.GENERAL
}
