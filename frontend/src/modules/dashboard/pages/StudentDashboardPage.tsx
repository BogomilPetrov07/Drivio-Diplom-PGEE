import { useEffect, useMemo, useState } from 'react'
import {
  AlarmClock,
  BellRing,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  MessageSquareText,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Language } from '../../../i18n/language'
import { useAuth } from '../../auth/hooks'
import {
  fetchMyNotifications,
  fetchStudentLessons,
  fetchStudentScheduleCycle,
  fetchUserSupportThreads,
  type DayKey,
  type LessonListItem,
  type LessonSessionState,
  type StudentScheduleCycle,
  type SupportThread,
} from '../api'
import { addDays, formatWeekRange, getStartOfWeek } from './instructor-schedule/week'

interface Props {
  language: Language
}

type LessonFilter = 'all' | 'upcoming' | 'action'

const DAY_KEYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const ACTION_STATES = new Set<LessonSessionState>(['START_CODE_ISSUED', 'ACTIVE'])
const UPCOMING_STATES = new Set<LessonSessionState>(['PLANNED', 'START_CODE_ISSUED', 'ACTIVE'])

function toIsoDate(value: Date) {
  const copy = new Date(value)
  copy.setHours(0, 0, 0, 0)
  return copy.toISOString().slice(0, 10)
}

function formatDateTime(value: string, locale: string) {
  return new Date(value).toLocaleString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeFromNow(value: string, language: Language) {
  const formatter = new Intl.RelativeTimeFormat(language === 'bg' ? 'bg-BG' : 'en-US', { numeric: 'auto' })
  const diffMs = new Date(value).getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60000)

  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, 'minute')

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, 'hour')

  const diffDays = Math.round(diffHours / 24)
  return formatter.format(diffDays, 'day')
}

function getLessonStateLabel(state: LessonSessionState, language: Language) {
  const isBg = language === 'bg'
  if (state === 'START_CODE_ISSUED') return isBg ? 'Очаква код за старт' : 'Waiting for start code'
  if (state === 'ACTIVE') return isBg ? 'Урокът е активен' : 'Lesson is active'
  if (state === 'FAILED') return isBg ? 'Неуспешен урок' : 'Lesson failed'
  if (state === 'COMPLETED') return isBg ? 'Приключен урок' : 'Lesson completed'
  return isBg ? 'Планиран урок' : 'Planned lesson'
}

function getScheduleStatusLabel(status: StudentScheduleCycle['cycle']['status'], language: Language) {
  const isBg = language === 'bg'
  if (status === 'SENT_TO_STUDENTS') return isBg ? 'Изпратен за отговор' : 'Sent for your response'
  if (status === 'COLLECTING_RESPONSES') return isBg ? 'Събират се отговори' : 'Collecting responses'
  if (status === 'READY_TO_ALLOCATE') return isBg ? 'Готов за разпределение' : 'Ready to allocate'
  if (status === 'ALLOCATED') return isBg ? 'Разпределен' : 'Allocated'
  if (status === 'PUBLISHED') return isBg ? 'Публикуван' : 'Published'
  return isBg ? 'Чернова' : 'Draft'
}

function getLessonStateTone(state: LessonSessionState) {
  if (state === 'START_CODE_ISSUED') return 'border-cyan-400/60 bg-cyan-400/10 text-cyan-700 dark:text-cyan-200'
  if (state === 'ACTIVE') return 'border-sky-400/60 bg-sky-400/10 text-sky-700 dark:text-sky-200'
  if (state === 'FAILED') return 'border-error/60 bg-error/10 text-error'
  if (state === 'COMPLETED') return 'border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
  return 'border-base-300 bg-base-200/70 text-base-content/70'
}

function getSupportStatusLabel(status: SupportThread['status'], language: Language) {
  const isBg = language === 'bg'
  if (status === 'WAITING_USER') return isBg ? 'Очаква ваш отговор' : 'Waiting for you'
  if (status === 'CLOSED') return isBg ? 'Затворен' : 'Closed'
  return isBg ? 'Отворен' : 'Open'
}

export default function StudentDashboardPage({ language }: Props) {
  const { user } = useAuth()
  const isBg = language === 'bg'
  const locale = isBg ? 'bg-BG' : 'en-US'
  const weekStartDate = useMemo(() => getStartOfWeek(new Date()), [])
  const [schedule, setSchedule] = useState<StudentScheduleCycle | null>(null)
  const [lessons, setLessons] = useState<LessonListItem[]>([])
  const [supportThreads, setSupportThreads] = useState<SupportThread[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [lessonFilter, setLessonFilter] = useState<LessonFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let cancelled = false

    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const weekStart = toIsoDate(weekStartDate)
        const [scheduleData, lessonRows, notificationData, threads] = await Promise.all([
          fetchStudentScheduleCycle(weekStart),
          fetchStudentLessons(weekStart),
          fetchMyNotifications(6),
          fetchUserSupportThreads(),
        ])

        if (cancelled) return

        setSchedule(scheduleData)
        setLessons(lessonRows)
        setUnreadCount(notificationData.unreadCount)
        setSupportThreads(threads)
      } catch {
        if (!cancelled) {
          setError(isBg ? 'Не успяхме да заредим началната страница.' : 'We could not load the student homepage.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [isBg, weekStartDate])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 60_000)

    return () => window.clearInterval(intervalId)
  }, [])

  const lessonsForWeek = useMemo(() => {
    if (lessons.length > 0) return lessons
    if (!schedule) return []
    return schedule.assignedSlots as LessonListItem[]
  }, [lessons, schedule])

  const sortedLessons = useMemo(
    () => [...lessonsForWeek].sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime)),
    [lessonsForWeek],
  )

  const upcomingLessons = useMemo(
    () => sortedLessons.filter((lesson) => new Date(lesson.endTime).getTime() >= now && UPCOMING_STATES.has(lesson.state)),
    [now, sortedLessons],
  )

  const actionLessons = useMemo(
    () => sortedLessons.filter((lesson) => ACTION_STATES.has(lesson.state)),
    [sortedLessons],
  )

  const completedLessons = useMemo(
    () => sortedLessons.filter((lesson) => lesson.state === 'COMPLETED' || lesson.isDone),
    [sortedLessons],
  )

  const nextLesson = upcomingLessons[0] ?? null
  const activeLesson = sortedLessons.find((lesson) => lesson.state === 'ACTIVE') ?? null
  const startCodeLesson = sortedLessons.find((lesson) => lesson.state === 'START_CODE_ISSUED') ?? null
  const waitingSupportThread = supportThreads.find((thread) => thread.status === 'WAITING_USER') ?? null
  const openSupportThread = supportThreads.find((thread) => thread.status === 'OPEN') ?? null
  const prioritySupportThread = waitingSupportThread ?? openSupportThread ?? supportThreads[0] ?? null

  const displayedLessons = useMemo(() => {
    if (lessonFilter === 'upcoming') return upcomingLessons
    if (lessonFilter === 'action') return actionLessons
    return sortedLessons
  }, [actionLessons, lessonFilter, sortedLessons, upcomingLessons])

  const weekAvailabilitySummary = useMemo(() => {
    if (!schedule) return { available: 0, unavailable: 0, assigned: 0 }

    const available = DAY_KEYS.reduce((count, dayKey) => count + (schedule.slotBlueprint[dayKey]?.length ?? 0), 0)
    const unavailable = DAY_KEYS.reduce((count, dayKey) => count + (schedule.reply.unavailableSlotKeys[dayKey]?.length ?? 0), 0)
    return { available, unavailable, assigned: schedule.assignedSlots.length }
  }, [schedule])

  const weeklyTimeline = useMemo(() => {
    return DAY_KEYS.map((dayKey, index) => {
      const date = addDays(weekStartDate, index)
      const items = sortedLessons.filter((lesson) => {
        if (lesson.dayKey === dayKey) return true
        const day = new Date(lesson.startTime).getDay()
        const resolvedKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][day]
        return resolvedKey === dayKey
      })

      return {
        dayKey,
        dateLabel: date.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
        title:
          isBg
            ? date.toLocaleDateString('bg-BG', { weekday: 'long' })
            : date.toLocaleDateString('en-US', { weekday: 'long' }),
        items,
      }
    })
  }, [isBg, locale, sortedLessons, weekStartDate])

  const pageCopy = {
    greeting: isBg ? 'Добре дошъл обратно' : 'Welcome back',
    subtitle:
      isBg
        ? 'Ето актуален преглед на вашата учебна седмица, базиран само на наличните данни в платформата.'
        : 'Here is a live view of your training week using only the data already available in the platform.',
    retry: isBg ? 'Опитайте отново от графика или презаредете страницата.' : 'Try again from Schedule or refresh the page.',
    thisWeek: isBg ? 'Тази седмица' : 'This week',
    nextLesson: isBg ? 'Следващ урок' : 'Next lesson',
    noNextLesson: isBg ? 'Няма предстоящ урок за тази седмица.' : 'No upcoming lesson for this week.',
    currentFocus: isBg ? 'Текущ фокус' : 'Current focus',
    scheduleCard: isBg ? 'Статус на графика' : 'Schedule status',
    notificationsCard: isBg ? 'Непрочетени известия' : 'Unread notifications',
    supportCard: isBg ? 'Поддръжка' : 'Support',
    lessonsCard: isBg ? 'Уроци за седмицата' : 'Lessons this week',
    completedCard: isBg ? 'Завършени часове за седмицата' : 'Completed lessons this week',
    availabilityCard: isBg ? 'Изпратена наличност' : 'Submitted availability',
    assignedCard: isBg ? 'Разпределени уроци' : 'Assigned lessons',
    filters: {
      all: isBg ? 'Всички' : 'All',
      upcoming: isBg ? 'Предстоящи' : 'Upcoming',
      action: isBg ? 'Изискват действие' : 'Needs action',
    },
    actions: {
      openSchedule: isBg ? 'Отвори графика' : 'Open schedule',
      openSupport: isBg ? 'Отвори поддръжка' : 'Open support',
      openNotifications: isBg ? 'Отвори известия' : 'Open notifications',
      profile: isBg ? 'Профил' : 'Profile',
    },
    timeline: isBg ? 'Седмичен ритъм' : 'Weekly rhythm',
    lessonsList: isBg ? 'Списък с уроци' : 'Lesson list',
    noLessonsMatch: isBg ? 'Няма уроци за избрания филтър.' : 'No lessons match this filter.',
    noSupport: isBg ? 'Няма активни разговори с поддръжката.' : 'No active support threads.',
    waitingReply: isBg ? 'Има разговор, който чака ваш отговор.' : 'A support thread is waiting for your reply.',
    unreadHint: isBg ? 'Проверете какво е ново в профила ви.' : 'Check what is new in your account.',
    availabilityHint:
      isBg
        ? 'Наличностите са тези, които вече сте изпратили за текущия цикъл.'
        : 'Availability reflects what you already submitted for the current cycle.',
  }

  if (loading) {
    return (
      <section className="space-y-4 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-4 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)] sm:p-5">
        <div className="skeleton h-8 w-56 rounded-lg" />
        <div className="grid gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-base-300 bg-base-100 p-4">
              <div className="skeleton h-4 w-24 rounded-md" />
              <div className="mt-3 skeleton h-8 w-16 rounded-md" />
              <div className="mt-4 skeleton h-3 w-full rounded-md" />
            </div>
          ))}
        </div>
        <div className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
            <div className="skeleton h-5 w-40 rounded-md" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="skeleton h-16 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
            <div className="skeleton h-5 w-32 rounded-md" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="skeleton h-12 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="rounded-2xl border border-error/30 bg-error/5 p-5 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)]">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 h-5 w-5 text-error" />
          <div>
            <h2 className="text-lg font-semibold text-base-content">{error}</h2>
            <p className="mt-1 text-sm text-base-content/70">{pageCopy.retry}</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-4 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)] sm:space-y-5 sm:p-5 lg:p-6">
      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.95fr]">
        <article className="rounded-2xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm sm:p-5">
          <p className="text-sm font-medium text-base-content/65">{pageCopy.greeting}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
            {user?.username ?? (isBg ? 'Студент' : 'Student')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-base-content/70">{pageCopy.subtitle}</p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-base-300 bg-base-100 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-base-content/55">{pageCopy.thisWeek}</p>
              <p className="mt-2 text-lg font-semibold text-base-content">{formatWeekRange(weekStartDate)}</p>
              <p className="mt-1 text-sm text-base-content/70">{pageCopy.scheduleCard}</p>
            </div>
            <div className="rounded-xl border border-base-300 bg-base-100 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-base-content/55">{pageCopy.nextLesson}</p>
              <p className="mt-2 text-lg font-semibold text-base-content">
                {nextLesson ? formatRelativeFromNow(nextLesson.startTime, language) : '—'}
              </p>
              <p className="mt-1 text-sm text-base-content/70">
                {nextLesson ? formatDateTime(nextLesson.startTime, locale) : pageCopy.noNextLesson}
              </p>
            </div>
            <div className="rounded-xl border border-base-300 bg-base-100 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-base-content/55">{pageCopy.currentFocus}</p>
              <p className="mt-2 text-lg font-semibold text-base-content">
                {activeLesson
                  ? isBg
                    ? 'Имате активен урок'
                    : 'You have an active lesson'
                  : startCodeLesson
                  ? isBg
                    ? 'Чака се код за старт'
                    : 'Start code is waiting'
                  : schedule
                  ? getScheduleStatusLabel(schedule.cycle.status, language)
                  : isBg
                  ? 'Очаква се график'
                  : 'Waiting for schedule'}
              </p>
              <p className="mt-1 text-sm text-base-content/70">
                {activeLesson || startCodeLesson
                  ? formatDateTime((activeLesson ?? startCodeLesson)!.startTime, locale)
                  : isBg
                  ? 'Следете графика си за нови разпределения.'
                  : 'Keep an eye on your schedule for new allocations.'}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/dashboard/student/schedule" className="btn btn-sm btn-primary">
              <CalendarDays className="h-4 w-4" />
              {pageCopy.actions.openSchedule}
            </Link>
            <Link to="/dashboard/student/support" className="btn btn-sm btn-outline">
              <MessageSquareText className="h-4 w-4" />
              {pageCopy.actions.openSupport}
            </Link>
            <Link to="/dashboard/student/notifications" className="btn btn-sm btn-outline">
              <BellRing className="h-4 w-4" />
              {pageCopy.actions.openNotifications}
            </Link>
            <Link to="/dashboard/student/profile" className="btn btn-sm btn-outline">
              <BookOpen className="h-4 w-4" />
              {pageCopy.actions.profile}
            </Link>
          </div>
        </article>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-base-content/55">{pageCopy.scheduleCard}</p>
                <p className="mt-2 text-lg font-semibold text-base-content">
                  {schedule ? getScheduleStatusLabel(schedule.cycle.status, language) : (isBg ? 'Няма цикъл' : 'No cycle')}
                </p>
              </div>
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-sm text-base-content/70">
              {schedule
                ? `${pageCopy.thisWeek}: ${formatWeekRange(weekStartDate)}`
                : isBg
                ? 'Инструкторът още не е изпратил график за текущата седмица.'
                : 'Your instructor has not sent a schedule for the current week yet.'}
            </p>
          </article>

          <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-base-content/55">{pageCopy.notificationsCard}</p>
                <p className="mt-2 text-3xl font-semibold text-base-content">{unreadCount}</p>
              </div>
              <BellRing className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-sm text-base-content/70">{pageCopy.unreadHint}</p>
          </article>

          <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-base-content/55">{pageCopy.supportCard}</p>
                <p className="mt-2 text-lg font-semibold text-base-content">
                  {prioritySupportThread
                    ? getSupportStatusLabel(prioritySupportThread.status, language)
                    : pageCopy.noSupport}
                </p>
              </div>
              <MessageSquareText className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 text-sm text-base-content/70">
              {waitingSupportThread
                ? pageCopy.waitingReply
                : prioritySupportThread?.latestMessagePreview || pageCopy.noSupport}
            </p>
          </article>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.12em] text-base-content/55">{pageCopy.lessonsCard}</p>
          <p className="mt-2 text-3xl font-semibold text-base-content">{sortedLessons.length}</p>
        </article>
        <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.12em] text-base-content/55">{pageCopy.completedCard}</p>
          <p className="mt-2 text-3xl font-semibold text-base-content">{completedLessons.length}</p>
        </article>
        <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.12em] text-base-content/55">{pageCopy.availabilityCard}</p>
          <p className="mt-2 text-3xl font-semibold text-base-content">{weekAvailabilitySummary.unavailable}</p>
          <p className="mt-1 text-sm text-base-content/65">{pageCopy.availabilityHint}</p>
        </article>
        <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.12em] text-base-content/55">{pageCopy.assignedCard}</p>
          <p className="mt-2 text-3xl font-semibold text-base-content">{weekAvailabilitySummary.assigned}</p>
          <p className="mt-1 text-sm text-base-content/65">
            {isBg ? `Свободни слотове: ${weekAvailabilitySummary.available}` : `Available slots: ${weekAvailabilitySummary.available}`}
          </p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-base-content">{pageCopy.lessonsList}</h3>
              <p className="text-sm text-base-content/65">
                {isBg ? 'Филтрирайте седмичните уроци според това, което искате да видите първо.' : 'Filter weekly lessons by what matters most right now.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`btn btn-sm ${lessonFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setLessonFilter('all')}
              >
                {pageCopy.filters.all}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${lessonFilter === 'upcoming' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setLessonFilter('upcoming')}
              >
                {pageCopy.filters.upcoming}
              </button>
              <button
                type="button"
                className={`btn btn-sm ${lessonFilter === 'action' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setLessonFilter('action')}
              >
                {pageCopy.filters.action}
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {displayedLessons.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-base-300 bg-base-200/35 px-4 py-8 text-center text-sm text-base-content/65">
                {pageCopy.noLessonsMatch}
              </div>
            ) : (
              displayedLessons.map((lesson) => (
                <article key={lesson.id} className="rounded-xl border border-base-300/80 bg-base-100 p-4 transition hover:border-base-content/20">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${getLessonStateTone(lesson.state)}`}>
                        {lesson.state === 'START_CODE_ISSUED' ? <ShieldCheck className="h-3.5 w-3.5" /> : lesson.state === 'COMPLETED' ? <CircleCheck className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                        {getLessonStateLabel(lesson.state, language)}
                      </div>
                      <p className="mt-3 text-base font-semibold text-base-content">{formatDateTime(lesson.startTime, locale)}</p>
                      <p className="mt-1 text-sm text-base-content/65">
                        {new Date(lesson.endTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link to={lesson.state === 'START_CODE_ISSUED' ? `/dashboard/student/schedule?startLessonId=${lesson.id}` : '/dashboard/student/schedule'} className="btn btn-sm btn-outline">
                        {lesson.state === 'START_CODE_ISSUED'
                          ? (isBg ? 'Въведи код' : 'Enter code')
                          : (isBg ? 'Виж в графика' : 'View in schedule')}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm sm:p-5">
            <h3 className="text-lg font-semibold text-base-content">{pageCopy.timeline}</h3>
            <div className="mt-4 space-y-3">
              {weeklyTimeline.map((day) => (
                <div key={day.dayKey} className="rounded-xl border border-base-300/80 bg-base-100 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold capitalize text-base-content">{day.title}</p>
                      <p className="text-xs text-base-content/60">{day.dateLabel}</p>
                    </div>
                    <span className="rounded-full bg-base-200 px-2.5 py-1 text-xs font-medium text-base-content/70">
                      {day.items.length}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {day.items.length === 0 ? (
                      <p className="text-sm text-base-content/55">{isBg ? 'Няма урок' : 'No lesson'}</p>
                    ) : (
                      day.items.map((lesson) => (
                        <div key={lesson.id} className="flex items-center gap-2 rounded-xl bg-base-200/60 px-3 py-2 text-sm text-base-content">
                          <AlarmClock className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {new Date(lesson.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-base-content/55">•</span>
                          <span className="truncate text-base-content/70">{getLessonStateLabel(lesson.state, language)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm sm:p-5">
            <h3 className="text-lg font-semibold text-base-content">{pageCopy.currentFocus}</h3>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-base-content/55">{pageCopy.nextLesson}</p>
                <p className="mt-2 text-sm font-semibold text-base-content">
                  {nextLesson ? formatDateTime(nextLesson.startTime, locale) : pageCopy.noNextLesson}
                </p>
              </div>
              <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-base-content/55">{pageCopy.supportCard}</p>
                <p className="mt-2 text-sm font-semibold text-base-content">
                  {prioritySupportThread
                    ? getSupportStatusLabel(prioritySupportThread.status, language)
                    : pageCopy.noSupport}
                </p>
                {prioritySupportThread ? (
                  <p className="mt-1 text-sm text-base-content/65">{prioritySupportThread.latestMessagePreview}</p>
                ) : null}
              </div>
              <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-base-content/55">{pageCopy.notificationsCard}</p>
                <p className="mt-2 text-sm font-semibold text-base-content">
                  {isBg ? `Непрочетени: ${unreadCount}` : `Unread: ${unreadCount}`}
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}
