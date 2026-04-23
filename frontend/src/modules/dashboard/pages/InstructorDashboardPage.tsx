import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, LifeBuoy, Mail, RefreshCw, TriangleAlert, Users } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import type { Language } from '../../../i18n/language'
import { useAuth } from '../../auth/hooks'
import {
  fetchInstructorSchedule,
  fetchInstructorStudents,
  type InstructorDaySchedule,
  type InstructorSchedule,
  type InstructorStudent,
} from '../api'

interface Props { language: Language }

type FocusSort = 'risk' | 'progress' | 'name'
type ScheduleMode = 'today' | 'week'
type StudentStatus = 'needs-focus' | 'on-track' | 'ready'

const REQUIRED_HOURS = 31
const FALLBACK_MAX_STUDENTS = 12
const NEEDS_FOCUS_MIN_HOURS = 1
const NEEDS_FOCUS_COMPARE_BELOW_HOURS = 20
const NEEDS_FOCUS_GAP_HOURS = 6
const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
type DayKey = (typeof DAY_KEYS)[number]

const BG = {
  loadError: '\u041d\u0435 \u0443\u0441\u043f\u044f\u0445\u043c\u0435 \u0434\u0430 \u0437\u0430\u0440\u0435\u0434\u0438\u043c \u0434\u0430\u043d\u043d\u0438\u0442\u0435 \u0437\u0430 \u0442\u0430\u0431\u043b\u043e\u0442\u043e.',
  refreshError: '\u041e\u043f\u0440\u0435\u0441\u043d\u044f\u0432\u0430\u043d\u0435\u0442\u043e \u043d\u0435 \u0431\u0435 \u0443\u0441\u043f\u0435\u0448\u043d\u043e. \u041e\u043f\u0438\u0442\u0430\u0439\u0442\u0435 \u043e\u0442\u043d\u043e\u0432\u043e.',
  title: '\u041d\u0430\u0447\u0430\u043b\u043e \u043d\u0430 \u0438\u043d\u0441\u0442\u0440\u0443\u043a\u0442\u043e\u0440\u0430',
  greeting: (username: string) =>
    `\u0414\u043e\u0431\u044a\u0440 \u0434\u0435\u043d, ${username}. \u0415\u0442\u043e \u043d\u0430\u0439-\u0432\u0430\u0436\u043d\u0438\u0442\u0435 \u043c\u0435\u0442\u0440\u0438\u043a\u0438 \u0438 \u043a\u043e\u043d\u0442\u0440\u043e\u043b\u0438 \u0437\u0430 \u0434\u0435\u043d\u044f.`,
  refresh: '\u041e\u043f\u0440\u0435\u0441\u043d\u0438',
  refreshing: '\u041e\u043f\u0440\u0435\u0441\u043d\u044f\u0432\u0430\u043d\u0435...',
  students: '\u041a\u0443\u0440\u0441\u0438\u0441\u0442\u0438',
  totalAssigned: (count: number) => `\u041e\u0431\u0449\u043e \u0437\u0430\u043f\u0438\u0441\u0430\u043d\u0438: ${count}`,
  averageProgress: '\u0421\u0440\u0435\u0434\u0435\u043d \u043d\u0430\u043f\u0440\u0435\u0434\u044a\u043a',
  ofTarget: '\u043e\u0442 \u0446\u0435\u043b\u0442\u0430',
  needsFocus: '\u041d\u0443\u0436\u0434\u0430 \u043e\u0442 \u0444\u043e\u043a\u0443\u0441',
  laggingUnder20Hours: '\u043a\u0443\u0440\u0441\u0438\u0441\u0442\u0438 \u0441 \u0433\u043e\u043b\u044f\u043c\u043e \u0438\u0437\u043e\u0441\u0442\u0430\u0432\u0430\u043d\u0435 \u043f\u043e\u0434 20 \u0447\u0430\u0441\u0430',
  examReady: '\u0413\u043e\u0442\u043e\u0432\u0438 \u0437\u0430 \u0438\u0437\u043f\u0438\u0442',
  scheduleActive: (count: number) => `\u0421 \u0430\u043a\u0442\u0438\u0432\u0435\u043d \u0433\u0440\u0430\u0444\u0438\u043a: ${count}/7 \u0434\u043d\u0438`,
  focusTitle: '\u0424\u043e\u043a\u0443\u0441 \u0432\u044a\u0440\u0445\u0443 \u043a\u0443\u0440\u0441\u0438\u0441\u0442\u0438\u0442\u0435',
  onlyRisk: '\u0421\u0430\u043c\u043e \u0440\u0438\u0441\u043a\u043e\u0432\u0438',
  sortRisk: '\u0421\u043e\u0440\u0442\u0438\u0440\u0430\u043d\u0435: \u0440\u0438\u0441\u043a',
  sortProgress: '\u0421\u043e\u0440\u0442\u0438\u0440\u0430\u043d\u0435: \u043d\u0430\u043f\u0440\u0435\u0434\u044a\u043a',
  sortName: '\u0421\u043e\u0440\u0442\u0438\u0440\u0430\u043d\u0435: \u0438\u043c\u0435',
  focusShowing: (count: number) => `\u041f\u043e\u043a\u0430\u0437\u0432\u0430\u043c\u0435 ${count} \u043a\u0443\u0440\u0441\u0438\u0441\u0442\u0430`,
  focusEmpty: '\u041d\u044f\u043c\u0430 \u043a\u0443\u0440\u0441\u0438\u0441\u0442\u0438 \u0437\u0430 \u043f\u043e\u043a\u0430\u0437\u0432\u0430\u043d\u0435 \u0441 \u0442\u0435\u0437\u0438 \u0444\u0438\u043b\u0442\u0440\u0438.',
  scheduleTitle: '\u0413\u0440\u0430\u0444\u0438\u043a',
  today: '\u0414\u043d\u0435\u0441',
  week: '\u0421\u0435\u0434\u043c\u0438\u0446\u0430',
  noSchedule: '\u041d\u044f\u043c\u0430 \u0437\u0430\u043f\u0430\u0437\u0435\u043d \u0433\u0440\u0430\u0444\u0438\u043a \u0432\u0441\u0435 \u043e\u0449\u0435.',
  openPlanner: '\u041e\u0442\u0432\u043e\u0440\u0438 \u043f\u043b\u0430\u043d\u0435\u0440\u0430 \u043d\u0430 \u0433\u0440\u0430\u0444\u0438\u043a\u0430',
  todayPlan: '\u0414\u043d\u0435\u0448\u0435\u043d \u043f\u043b\u0430\u043d',
  offDay: '\u041f\u043e\u0447\u0438\u0432\u0435\u043d \u0434\u0435\u043d',
  approximateSlots: '\u041f\u0440\u0438\u0431\u043b\u0438\u0437\u0438\u0442\u0435\u043b\u043d\u0438 \u0441\u043b\u043e\u0442\u043e\u0432\u0435',
  activeDays: '\u0410\u043a\u0442\u0438\u0432\u043d\u0438 \u0434\u043d\u0438',
  weeklySlots: '\u0421\u0435\u0434\u043c\u0438\u0447\u043d\u0438 \u0441\u043b\u043e\u0442\u043e\u0432\u0435',
  offShort: '\u043f\u043e\u0447\u0438\u0432\u043a\u0430',
  quickActions: '\u0411\u044a\u0440\u0437\u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f',
  manageStudents: '\u0423\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435 \u043d\u0430 \u043a\u0443\u0440\u0441\u0438\u0441\u0442\u0438',
  planSchedule: '\u041f\u043b\u0430\u043d\u0438\u0440\u0430\u0439 \u0433\u0440\u0430\u0444\u0438\u043a',
  inbox: '\u0412\u0445\u043e\u0434\u044f\u0449\u0438',
  support: '\u041f\u043e\u0434\u0434\u0440\u044a\u0436\u043a\u0430',
  capacity: '\u041a\u0430\u043f\u0430\u0446\u0438\u0442\u0435\u0442',
  currentCapacity: (current: number, max: number) => `\u0422\u0435\u043a\u0443\u0449 \u043a\u0430\u043f\u0430\u0446\u0438\u0442\u0435\u0442: ${current} \u043e\u0442 ${max} \u043a\u0443\u0440\u0441\u0438\u0441\u0442\u0430.`,
  utilization: '\u0437\u0430\u043f\u044a\u043b\u043d\u0435\u043d\u043e\u0441\u0442',
  cappedInfo: (total: number, max: number) => `\u0421\u0438\u0441\u0442\u0435\u043c\u0430\u0442\u0430 \u043e\u0442\u0447\u0438\u0442\u0430 ${total} \u0437\u0430\u043f\u0438\u0441\u0430\u043d\u0438. \u041f\u043e\u043a\u0430\u0437\u0430\u043d\u0438 \u0441\u0430 \u043f\u044a\u0440\u0432\u0438\u0442\u0435 ${max}.`,
  dayLabels: {
    monday: '\u041f\u043e\u043d\u0435\u0434\u0435\u043b\u043d\u0438\u043a',
    tuesday: '\u0412\u0442\u043e\u0440\u043d\u0438\u043a',
    wednesday: '\u0421\u0440\u044f\u0434\u0430',
    thursday: '\u0427\u0435\u0442\u0432\u044a\u0440\u0442\u044a\u043a',
    friday: '\u041f\u0435\u0442\u044a\u043a',
    saturday: '\u0421\u044a\u0431\u043e\u0442\u0430',
    sunday: '\u041d\u0435\u0434\u0435\u043b\u044f',
  } as Record<DayKey, string>,
  statusReadyShort: '\u0413\u043e\u0442\u043e\u0432',
  hourShort: '\u0447',
}

function clockToMinutes(value: string) {
  const [rawHours, rawMinutes] = value.split(':')
  const hours = Number(rawHours)
  const minutes = Number(rawMinutes)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0
  return hours * 60 + minutes
}

function getProgressPercent(hours: number) {
  return Math.max(0, Math.min(100, Math.round((hours / REQUIRED_HOURS) * 100)))
}

function getNeedsFocusStudentIds(students: InstructorStudent[]) {
  const comparableStudents = students.filter(
    (student) =>
      student.completedHours >= NEEDS_FOCUS_MIN_HOURS
      && student.completedHours < NEEDS_FOCUS_COMPARE_BELOW_HOURS,
  )

  if (comparableStudents.length < 2) {
    return new Set<string>()
  }

  const highestComparableHours = Math.max(...comparableStudents.map((student) => student.completedHours))

  return new Set(
    comparableStudents
      .filter((student) => highestComparableHours - student.completedHours >= NEEDS_FOCUS_GAP_HOURS)
      .map((student) => student.id),
  )
}

function getStudentStatus(student: InstructorStudent, needsFocusStudentIds: Set<string>): StudentStatus {
  if (student.completedHours >= REQUIRED_HOURS) return 'ready'
  if (needsFocusStudentIds.has(student.id)) return 'needs-focus'
  return 'on-track'
}

function getApproximateSlotsForDay(day: InstructorDaySchedule) {
  if (!day.enabled) return 0
  const startMinutes = clockToMinutes(day.startTime)
  const endMinutes = clockToMinutes(day.endTime)
  if (endMinutes <= startMinutes) return 0
  const possibleSlots = Math.floor((endMinutes - startMinutes) / 60)
  const blockedSlots = day.blockedLessonKeys.length
  return Math.max(0, possibleSlots - blockedSlots)
}

function getCurrentDayKey(): DayKey {
  const day = new Date().getDay()
  const map: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return map[day] || 'monday'
}

export default function InstructorDashboardPage({ language }: Props) {
  const isBg = language === 'bg'
  const { user } = useAuth()
  const location = useLocation()

  const [students, setStudents] = useState<InstructorStudent[]>([])
  const [maxStudents, setMaxStudents] = useState(FALLBACK_MAX_STUDENTS)
  const [totalStudents, setTotalStudents] = useState(0)
  const [schedule, setSchedule] = useState<InstructorSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showRiskOnly, setShowRiskOnly] = useState(false)
  const [focusSort, setFocusSort] = useState<FocusSort>('risk')
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('today')

  const basePath = location.pathname.startsWith('/dashboard/schooladmin/instructor')
    ? '/dashboard/schooladmin/instructor'
    : '/dashboard/instructor'

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const [studentsResponse, scheduleResponse] = await Promise.all([
          fetchInstructorStudents(),
          fetchInstructorSchedule(),
        ])

        if (!active) return
        setStudents(studentsResponse.students)
        setMaxStudents(studentsResponse.maxStudents || FALLBACK_MAX_STUDENTS)
        setTotalStudents(studentsResponse.totalStudents)
        setSchedule(scheduleResponse)
      } catch {
        if (!active) return
        setError(isBg ? BG.loadError : 'Could not load your dashboard data.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [isBg])

  const refreshDashboard = async () => {
    setRefreshing(true)
    setError(null)

    try {
      const [studentsResponse, scheduleResponse] = await Promise.all([
        fetchInstructorStudents(),
        fetchInstructorSchedule(),
      ])

      setStudents(studentsResponse.students)
      setMaxStudents(studentsResponse.maxStudents || FALLBACK_MAX_STUDENTS)
      setTotalStudents(studentsResponse.totalStudents)
      setSchedule(scheduleResponse)
    } catch {
      setError(isBg ? BG.refreshError : 'Refresh failed. Please try again.')
    } finally {
      setRefreshing(false)
    }
  }

  const needsFocusStudentIds = useMemo(
    () => getNeedsFocusStudentIds(students),
    [students],
  )

  const studentRows = useMemo(() => {
    return students.map((student) => ({
      ...student,
      status: getStudentStatus(student, needsFocusStudentIds),
      progress: getProgressPercent(student.completedHours),
      displayName: student.name || student.username,
    }))
  }, [students, needsFocusStudentIds])

  const averageHours = useMemo(() => {
    if (studentRows.length === 0) return 0
    const totalHours = studentRows.reduce((sum, student) => sum + student.completedHours, 0)
    return Math.round(totalHours / studentRows.length)
  }, [studentRows])

  const riskCount = useMemo(
    () => studentRows.filter((student) => student.status === 'needs-focus').length,
    [studentRows],
  )

  const readyCount = useMemo(
    () => studentRows.filter((student) => student.status === 'ready').length,
    [studentRows],
  )

  const focusStudents = useMemo(() => {
    let rows = [...studentRows]

    if (showRiskOnly) {
      rows = rows.filter((student) => student.status === 'needs-focus')
    }

    if (focusSort === 'risk') {
      const rank: Record<StudentStatus, number> = {
        'needs-focus': 0,
        'on-track': 1,
        ready: 2,
      }
      rows.sort((a, b) => {
        const statusRank = rank[a.status] - rank[b.status]
        if (statusRank !== 0) return statusRank
        return a.completedHours - b.completedHours
      })
    }

    if (focusSort === 'progress') {
      rows.sort((a, b) => b.progress - a.progress)
    }

    if (focusSort === 'name') {
      rows.sort((a, b) => a.displayName.localeCompare(b.displayName))
    }

    return rows.slice(0, 6)
  }, [studentRows, showRiskOnly, focusSort])

  const currentDayKey = getCurrentDayKey()

  const weeklyOverview = useMemo(() => {
    return DAY_KEYS.map((key) => {
      const day = schedule?.days[key] ?? null
      const slots = day ? getApproximateSlotsForDay(day) : 0
      return {
        key,
        enabled: Boolean(day?.enabled),
        startTime: day?.startTime || '--:--',
        endTime: day?.endTime || '--:--',
        slots,
      }
    })
  }, [schedule])

  const enabledDaysCount = useMemo(
    () => weeklyOverview.filter((day) => day.enabled).length,
    [weeklyOverview],
  )

  const weeklySlots = useMemo(
    () => weeklyOverview.reduce((sum, day) => sum + day.slots, 0),
    [weeklyOverview],
  )

  const todaysPlan = useMemo(
    () => weeklyOverview.find((day) => day.key === currentDayKey) || null,
    [weeklyOverview, currentDayKey],
  )

  const dayLabelMap: Record<DayKey, string> = isBg
    ? BG.dayLabels
    : { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' }

  const statusStyles: Record<StudentStatus, string> = {
    'needs-focus': 'badge badge-error badge-outline min-h-7 px-2 py-1 text-center text-[11px] leading-tight sm:text-xs',
    'on-track': 'badge badge-warning badge-outline min-h-7 px-2 py-1 text-center text-[11px] leading-tight sm:text-xs',
    ready: 'badge badge-success badge-outline min-h-7 px-2 py-1 text-center text-[11px] leading-tight sm:text-xs',
  }

  const statusLabels: Record<StudentStatus, string> = {
    'needs-focus': isBg ? BG.needsFocus : 'Needs focus',
    'on-track': isBg ? '\u0414\u043e\u0431\u0440\u0435 \u0432\u044a\u0440\u0432\u0438' : 'On track',
    ready: isBg ? BG.statusReadyShort : 'Ready',
  }

  const averageProgress = getProgressPercent(averageHours)
  const capacityPercent = Math.min(100, Math.round((students.length / Math.max(1, maxStudents)) * 100))
  const hourUnit = isBg ? BG.hourShort : 'h'
  const username = user?.username || 'instructor'

  return (
    <section className="space-y-3 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-3 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)] sm:space-y-4 sm:p-5 lg:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-base-content sm:text-2xl">
            {isBg ? BG.title : 'Instructor Home'}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-base-content/70">
            {isBg ? BG.greeting(username) : `Welcome back, ${username}. Here are your key controls for today.`}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-outline h-10 w-full rounded-xl sm:w-auto"
          onClick={() => void refreshDashboard()}
          disabled={refreshing || loading}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? (isBg ? BG.refreshing : 'Refreshing...') : (isBg ? BG.refresh : 'Refresh')}
        </button>
      </div>

      {error ? (
        <div className="alert alert-error rounded-xl border border-error/40 bg-error/10">
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <article key={`instructor-home-skeleton-${index}`} className="rounded-xl border border-base-300 bg-base-100/90 p-3 sm:p-4">
              <div className="skeleton h-4 w-1/2 rounded-md" />
              <div className="mt-3 skeleton h-8 w-2/3 rounded-md" />
              <div className="mt-2 skeleton h-4 w-3/4 rounded-md" />
            </article>
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
            <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-3 shadow-sm sm:p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-base-content/75">
                <Users className="h-4 w-4 text-primary" />
                <span>{isBg ? BG.students : 'Students'}</span>
              </div>
              <p className="mt-2 text-xl font-semibold text-base-content sm:text-2xl">{students.length}/{maxStudents}</p>
              <p className="text-xs text-base-content/65">
                {isBg ? BG.totalAssigned(totalStudents) : `Total assigned: ${totalStudents}`}
              </p>
            </article>

            <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-3 shadow-sm sm:p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-base-content/75">
                <Clock3 className="h-4 w-4 text-primary" />
                <span>{isBg ? BG.averageProgress : 'Average progress'}</span>
              </div>
              <p className="mt-2 text-xl font-semibold text-base-content sm:text-2xl">{averageHours}{hourUnit}</p>
              <p className="text-xs text-base-content/65">{averageProgress}% {isBg ? BG.ofTarget : 'of target'}</p>
            </article>

            <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-3 shadow-sm sm:p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-base-content/75">
                <TriangleAlert className="h-4 w-4 text-warning" />
                <span>{isBg ? BG.needsFocus : 'Needs focus'}</span>
              </div>
              <p className="mt-2 text-xl font-semibold text-base-content sm:text-2xl">{riskCount}</p>
              <p className="text-xs text-base-content/65">{isBg ? BG.laggingUnder20Hours : 'students with large gap under 20 hours'}</p>
            </article>

            <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-3 shadow-sm sm:p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-base-content/75">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>{isBg ? BG.examReady : 'Exam ready'}</span>
              </div>
              <p className="mt-2 text-xl font-semibold text-base-content sm:text-2xl">{readyCount}</p>
              <p className="text-xs text-base-content/65">
                {isBg ? BG.scheduleActive(enabledDaysCount) : `Schedule active: ${enabledDaysCount}/7 days`}
              </p>
            </article>
          </div>

          <div className="grid gap-3 md:grid-cols-[1.2fr_1fr] xl:grid-cols-[1.45fr_1fr]">
            <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-3 shadow-sm sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-base-content">{isBg ? BG.focusTitle : 'Student Focus Gadget'}</h3>
                <label className="label cursor-pointer gap-2 py-0">
                  <span className="label-text text-xs text-base-content/70">{isBg ? BG.onlyRisk : 'Only risk'}</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-warning toggle-sm"
                    checked={showRiskOnly}
                    onChange={(event) => setShowRiskOnly(event.target.checked)}
                  />
                </label>
              </div>

              <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <select
                  className="select select-sm select-bordered w-full rounded-lg border-base-300 bg-base-100/90 text-xs sm:w-auto"
                  value={focusSort}
                  onChange={(event) => setFocusSort(event.target.value as FocusSort)}
                >
                  <option value="risk">{isBg ? BG.sortRisk : 'Sort: Risk'}</option>
                  <option value="progress">{isBg ? BG.sortProgress : 'Sort: Progress'}</option>
                  <option value="name">{isBg ? BG.sortName : 'Sort: Name'}</option>
                </select>

                <p className="text-xs text-base-content/65">
                  {isBg ? BG.focusShowing(focusStudents.length) : `Showing ${focusStudents.length} students`}
                </p>
              </div>

              {focusStudents.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-base-300 bg-base-100/60 p-4 text-center text-xs text-base-content/70">
                  {isBg ? BG.focusEmpty : 'No students match this focus filter.'}
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {focusStudents.map((student) => (
                    <article key={student.id} className="rounded-xl border border-base-300/75 bg-base-100 px-3 py-2.5">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="min-w-0 md:flex-1">
                          <p className="truncate text-sm font-semibold text-base-content">{student.displayName}</p>
                          <p className="truncate text-xs text-base-content/65">@{student.username}</p>
                        </div>
                        <div className="flex justify-start md:justify-end">
                          <span className={statusStyles[student.status]}>{statusLabels[student.status]}</span>
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-base-content/70">
                        <span>{student.completedHours} / {REQUIRED_HOURS}{hourUnit}</span>
                        <span>{student.progress}%</span>
                      </div>
                      <progress className="progress progress-primary mt-1.5 h-2.5 w-full" value={student.progress} max={100} />
                    </article>
                  ))}
                </div>
              )}
            </article>

            <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-3 shadow-sm sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-base-content">{isBg ? BG.scheduleTitle : 'Schedule Gadget'}</h3>
                <div className="join">
                  <button
                    type="button"
                    className={`btn btn-sm join-item h-9 min-h-9 ${scheduleMode === 'today' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setScheduleMode('today')}
                  >
                    {isBg ? BG.today : 'Today'}
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm join-item h-9 min-h-9 ${scheduleMode === 'week' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setScheduleMode('week')}
                  >
                    {isBg ? BG.week : 'Week'}
                  </button>
                </div>
              </div>

              {!schedule ? (
                <div className="mt-4 rounded-xl border border-dashed border-base-300 bg-base-100/60 p-4 text-sm text-base-content/75">
                  <p>{isBg ? BG.noSchedule : 'No saved schedule yet.'}</p>
                  <Link to={`${basePath}/schedule`} className="btn btn-sm btn-outline mt-3 w-full rounded-lg sm:w-auto">
                    {isBg ? BG.openPlanner : 'Open schedule planner'}
                  </Link>
                </div>
              ) : scheduleMode === 'today' ? (
                <div className="mt-4 rounded-xl border border-base-300/75 bg-base-100 p-3">
                  <p className="text-xs font-semibold text-base-content/70">{isBg ? BG.todayPlan : 'Today plan'}</p>
                  <p className="mt-1 text-sm font-semibold text-base-content">
                    {dayLabelMap[currentDayKey]}: {todaysPlan?.enabled ? `${todaysPlan.startTime} - ${todaysPlan.endTime}` : (isBg ? BG.offDay : 'Off day')}
                  </p>
                  <p className="mt-1 text-xs text-base-content/70">
                    {isBg ? BG.approximateSlots : 'Approximate slots'}: {todaysPlan?.slots ?? 0}
                  </p>
                  <p className="mt-3 text-xs text-base-content/65">
                    {isBg ? BG.activeDays : 'Active days'}: {enabledDaysCount}/7
                  </p>
                  <p className="text-xs text-base-content/65">
                    {isBg ? BG.weeklySlots : 'Weekly slots'}: {weeklySlots}
                  </p>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {weeklyOverview.map((day) => (
                    <div key={day.key} className="grid grid-cols-[minmax(104px,auto)_1fr_auto] items-center gap-2 rounded-lg border border-base-300/70 bg-base-100 px-2.5 py-2 text-xs">
                      <span className="font-semibold text-base-content/80">{dayLabelMap[day.key]}</span>
                      {day.enabled ? (
                        <span className="truncate text-right text-base-content/80">{day.startTime}-{day.endTime}</span>
                      ) : (
                        <span className="truncate text-right text-base-content/50">{isBg ? BG.offShort : 'off'}</span>
                      )}
                      <span className="badge badge-ghost badge-sm">{day.slots}</span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-3 shadow-sm sm:p-4">
              <h3 className="text-base font-semibold text-base-content">{isBg ? BG.quickActions : 'Quick Actions'}</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Link to={`${basePath}/students`} className="btn btn-sm btn-outline h-11 justify-between rounded-lg">
                  <span>{isBg ? BG.manageStudents : 'Manage students'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to={`${basePath}/schedule`} className="btn btn-sm btn-outline h-11 justify-between rounded-lg">
                  <span>{isBg ? BG.planSchedule : 'Plan schedule'}</span>
                  <CalendarDays className="h-4 w-4" />
                </Link>
                <Link to={`${basePath}/inbox`} className="btn btn-sm btn-outline h-11 justify-between rounded-lg">
                  <span>{isBg ? BG.inbox : 'Inbox'}</span>
                  <Mail className="h-4 w-4" />
                </Link>
                <Link to={`${basePath}/support`} className="btn btn-sm btn-outline h-11 justify-between rounded-lg">
                  <span>{isBg ? BG.support : 'Support'}</span>
                  <LifeBuoy className="h-4 w-4" />
                </Link>
              </div>
            </article>

            <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-3 shadow-sm sm:p-4">
              <h3 className="text-base font-semibold text-base-content">{isBg ? BG.capacity : 'Capacity Gadget'}</h3>
              <p className="mt-2 text-sm text-base-content/75">
                {isBg ? BG.currentCapacity(students.length, maxStudents) : `Current capacity: ${students.length} out of ${maxStudents} students.`}
              </p>
              <progress className="progress progress-accent mt-3 h-2.5 w-full" value={capacityPercent} max={100} />
              <p className="mt-2 text-xs text-base-content/65">{capacityPercent}% {isBg ? BG.utilization : 'utilization'}</p>
              {totalStudents > maxStudents ? (
                <p className="mt-2 text-xs font-semibold text-warning">
                  {isBg ? BG.cappedInfo(totalStudents, maxStudents) : `System reports ${totalStudents} assigned. Display is limited to first ${maxStudents}.`}
                </p>
              ) : null}
            </article>
          </div>
        </>
      )}
    </section>
  )
}
