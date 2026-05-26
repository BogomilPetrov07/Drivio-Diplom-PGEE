import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, SlidersHorizontal, Users } from 'lucide-react'
import type { Language } from '../../../i18n/language'
import { fetchInstructorStudents, type InstructorStudent } from '../api'
import { useDashboardShell } from '../hooks'

interface Props { language: Language }

type StatusFilter = 'all' | 'needs-focus' | 'on-track' | 'ready'
type SortBy = 'name' | 'progress-low' | 'progress-high' | 'hours-high' | 'newest'

const REQUIRED_HOURS = 31
const FALLBACK_MAX_STUDENTS = 12
const NEEDS_FOCUS_MIN_HOURS = 1
const NEEDS_FOCUS_COMPARE_BELOW_HOURS = 20
const NEEDS_FOCUS_GAP_HOURS = 6

const BG = {
  loadError: '\u041d\u0435 \u0443\u0441\u043f\u044f\u0445\u043c\u0435 \u0434\u0430 \u0437\u0430\u0440\u0435\u0434\u0438\u043c \u043a\u0443\u0440\u0441\u0438\u0441\u0442\u0438\u0442\u0435.',
  title: '\u041a\u0443\u0440\u0441\u0438\u0441\u0442\u0438',
  subtitle: '\u041f\u0440\u0435\u0433\u043b\u0435\u0434 \u043d\u0430 \u043a\u0443\u0440\u0441\u0438\u0441\u0442\u0438\u0442\u0435 \u0438 \u043d\u0430\u043f\u0440\u0435\u0434\u044a\u043a\u0430 \u0438\u043c.',
  searchPlaceholder: '\u0422\u044a\u0440\u0441\u0435\u043d\u0435 \u043f\u043e \u0438\u043c\u0435, user \u0438\u043b\u0438 \u0438\u043c\u0435\u0439\u043b...',
  sortName: '\u0421\u043e\u0440\u0442\u0438\u0440\u0430\u043d\u0435: \u0438\u043c\u0435 \u0410-\u042f',
  sortProgressAsc: '\u0421\u043e\u0440\u0442\u0438\u0440\u0430\u043d\u0435: \u043d\u0430\u043f\u0440\u0435\u0434\u044a\u043a \u0432\u044a\u0437\u0445\u043e\u0434\u044f\u0449',
  sortProgressDesc: '\u0421\u043e\u0440\u0442\u0438\u0440\u0430\u043d\u0435: \u043d\u0430\u043f\u0440\u0435\u0434\u044a\u043a \u043d\u0438\u0437\u0445\u043e\u0434\u044f\u0449',
  sortHoursDesc: '\u0421\u043e\u0440\u0442\u0438\u0440\u0430\u043d\u0435: \u0447\u0430\u0441\u043e\u0432\u0435 \u043d\u0438\u0437\u0445\u043e\u0434\u044f\u0449\u043e',
  sortNewest: '\u0421\u043e\u0440\u0442\u0438\u0440\u0430\u043d\u0435: \u043d\u0430\u0439-\u043d\u043e\u0432\u0438',
  allStatuses: '\u0412\u0441\u0438\u0447\u043a\u0438 \u0441\u0442\u0430\u0442\u0443\u0441\u0438',
  statusNeedsFocus: '\u041d\u0443\u0436\u0434\u0430 \u043e\u0442 \u0444\u043e\u043a\u0443\u0441',
  statusOnTrack: '\u0414\u043e\u0431\u0440\u0435 \u0432\u044a\u0440\u0432\u0438',
  statusReady: '\u0413\u043e\u0442\u043e\u0432 \u0437\u0430 \u0438\u0437\u043f\u0438\u0442',
  showing: (visible: number, current: number, max: number) =>
    `\u041f\u043e\u043a\u0430\u0437\u0432\u0430\u043c\u0435 ${visible} \u043e\u0442 ${current} \u043a\u0443\u0440\u0441\u0438\u0441\u0442\u0430. \u041c\u0430\u043a\u0441\u0438\u043c\u0443\u043c: ${max}.`,
  cappedInfo: (total: number, max: number) =>
    `\u0412 \u0441\u0438\u0441\u0442\u0435\u043c\u0430\u0442\u0430 \u0438\u043c\u0430 ${total} \u043a\u0443\u0440\u0441\u0438\u0441\u0442\u0438. \u041f\u043e\u043a\u0430\u0437\u0430\u043d\u0438 \u0441\u0430 \u043f\u044a\u0440\u0432\u0438\u0442\u0435 ${max}.`,
  noStudents: '\u041d\u044f\u043c\u0430 \u043d\u0430\u043c\u0435\u0440\u0435\u043d\u0438 \u043a\u0443\u0440\u0441\u0438\u0441\u0442\u0438.',
  noStudentsHint: '\u041f\u0440\u043e\u043c\u0435\u043d\u0435\u0442\u0435 \u0442\u044a\u0440\u0441\u0435\u043d\u0435\u0442\u043e \u0438\u043b\u0438 \u0444\u0438\u043b\u0442\u044a\u0440\u0430.',
  noEmail: '\u041d\u044f\u043c\u0430 \u0438\u043c\u0435\u0439\u043b',
  progress: '\u041d\u0430\u043f\u0440\u0435\u0434\u044a\u043a',
  completedHours: '\u0417\u0430\u0432\u044a\u0440\u0448\u0435\u043d\u0438 \u0447\u0430\u0441\u043e\u0432\u0435',
  hourShort: '\u0447',
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

function getStudentStatus(student: InstructorStudent, needsFocusStudentIds: Set<string>): Exclude<StatusFilter, 'all'> {
  if (student.completedHours >= REQUIRED_HOURS) return 'ready'
  if (needsFocusStudentIds.has(student.id)) return 'needs-focus'
  return 'on-track'
}

export default function InstructorStudentsPage({ language }: Props) {
  const isBg = language === 'bg'
  const { pushToast } = useDashboardShell()
  const pushToastRef = useRef(pushToast)
  const [students, setStudents] = useState<InstructorStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [maxStudents, setMaxStudents] = useState(FALLBACK_MAX_STUDENTS)
  const [totalStudents, setTotalStudents] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    pushToastRef.current = pushToast
  }, [pushToast])

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      try {
        const response = await fetchInstructorStudents()
        if (!active) return
        setStudents(response.students)
        setMaxStudents(response.maxStudents || FALLBACK_MAX_STUDENTS)
        setTotalStudents(response.totalStudents)
      } catch {
        if (!active) return
        const message = isBg ? BG.loadError : 'Could not load students.'
        pushToastRef.current('error', message)
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [isBg])

  const needsFocusStudentIds = useMemo(
    () => getNeedsFocusStudentIds(students),
    [students],
  )

  const filteredStudents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    let rows = [...students]

    if (normalizedQuery) {
      rows = rows.filter((student) => {
        const name = (student.name || '').toLowerCase()
        const username = (student.username || '').toLowerCase()
        const email = (student.email || '').toLowerCase()
        return name.includes(normalizedQuery) || username.includes(normalizedQuery) || email.includes(normalizedQuery)
      })
    }

    if (statusFilter !== 'all') {
      rows = rows.filter((student) => getStudentStatus(student, needsFocusStudentIds) === statusFilter)
    }

    if (sortBy === 'name') {
      rows.sort((a, b) => {
        const aLabel = (a.name?.trim() || a.username || '').toLowerCase()
        const bLabel = (b.name?.trim() || b.username || '').toLowerCase()
        return aLabel.localeCompare(bLabel)
      })
    }
    if (sortBy === 'progress-low') {
      rows.sort((a, b) => getProgressPercent(a.completedHours) - getProgressPercent(b.completedHours))
    }
    if (sortBy === 'progress-high') {
      rows.sort((a, b) => getProgressPercent(b.completedHours) - getProgressPercent(a.completedHours))
    }
    if (sortBy === 'hours-high') {
      rows.sort((a, b) => b.completedHours - a.completedHours)
    }
    if (sortBy === 'newest') {
      rows.sort((a, b) => Date.parse(b.createdAt || '') - Date.parse(a.createdAt || ''))
    }

    return rows
  }, [students, searchQuery, statusFilter, sortBy, needsFocusStudentIds])

  const statusPillClass: Record<Exclude<StatusFilter, 'all'>, string> = {
    'needs-focus': 'badge badge-error badge-outline min-h-7 px-2 py-1 text-center text-[11px] leading-tight sm:text-xs',
    'on-track': 'badge badge-warning badge-outline min-h-7 px-2 py-1 text-center text-[11px] leading-tight sm:text-xs',
    ready: 'badge badge-success badge-outline min-h-7 px-2 py-1 text-center text-[11px] leading-tight sm:text-xs',
  }

  const statusLabel: Record<Exclude<StatusFilter, 'all'>, string> = {
    'needs-focus': isBg ? BG.statusNeedsFocus : 'Needs focus',
    'on-track': isBg ? BG.statusOnTrack : 'On track',
    ready: isBg ? BG.statusReady : 'Exam ready',
  }

  return (
    <section className="space-y-3 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-3 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)] sm:space-y-4 sm:p-5 lg:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-base-content sm:text-2xl">{isBg ? BG.title : 'Students'}</h2>
          <p className="mt-1 text-sm text-base-content/70">
            {isBg ? BG.subtitle : 'View all your students and their current progress.'}
          </p>
        </div>

        <div className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-base-300 bg-base-100/90 px-3 py-1.5 text-sm font-semibold text-base-content shadow-sm sm:w-auto sm:justify-start">
          <Users className="h-4 w-4 text-primary" />
          <span>{students.length}/{maxStudents}</span>
        </div>
      </div>

      <div className="grid gap-2 rounded-2xl border border-base-300/80 bg-base-100/85 p-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-[1.4fr_0.9fr_auto]">
        <label className="input input-bordered flex h-11 items-center gap-2 rounded-xl border-base-300 bg-base-100/90">
          <Search className="h-4 w-4 text-base-content/60" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={isBg ? BG.searchPlaceholder : 'Search by name, username, or email...'}
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>

        <label className="input input-bordered flex h-11 items-center gap-2 rounded-xl border-base-300 bg-base-100/90">
          <SlidersHorizontal className="h-4 w-4 text-base-content/60" />
          <select
            className="w-full bg-transparent text-sm outline-none"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortBy)}
          >
            <option value="name">{isBg ? BG.sortName : 'Sort: Name A-Z'}</option>
            <option value="progress-low">{isBg ? BG.sortProgressAsc : 'Sort: Progress low to high'}</option>
            <option value="progress-high">{isBg ? BG.sortProgressDesc : 'Sort: Progress high to low'}</option>
            <option value="hours-high">{isBg ? BG.sortHoursDesc : 'Sort: Completed hours high to low'}</option>
            <option value="newest">{isBg ? BG.sortNewest : 'Sort: Newest students'}</option>
          </select>
        </label>

        <select
          className="select select-bordered h-11 w-full rounded-xl border-base-300 bg-base-100/90 text-sm"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
        >
          <option value="all">{isBg ? BG.allStatuses : 'All statuses'}</option>
          <option value="needs-focus">{isBg ? BG.statusNeedsFocus : 'Needs focus'}</option>
          <option value="on-track">{isBg ? BG.statusOnTrack : 'On track'}</option>
          <option value="ready">{isBg ? BG.statusReady : 'Exam ready'}</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-base-content/65">
        <p>
          {isBg
            ? BG.showing(filteredStudents.length, students.length, maxStudents)
            : `Showing ${filteredStudents.length} of ${students.length} students. Maximum: ${maxStudents}.`}
        </p>
        {totalStudents > maxStudents ? (
          <p className="font-semibold text-warning">
            {isBg
              ? BG.cappedInfo(totalStudents, maxStudents)
              : `There are ${totalStudents} assigned students in total. Display is capped at ${maxStudents}.`}
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={`student-skeleton-${index}`} className="rounded-xl border border-base-300 bg-base-100/90 p-4">
              <div className="skeleton h-5 w-2/3 rounded-md" />
              <div className="mt-2 skeleton h-4 w-1/2 rounded-md" />
              <div className="mt-4 skeleton h-2.5 w-full rounded-full" />
              <div className="mt-2 skeleton h-4 w-1/3 rounded-md" />
            </article>
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-base-300 bg-base-100/60 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-base-content">{isBg ? BG.noStudents : 'No students found.'}</p>
          <p className="mt-1 text-xs text-base-content/65">
            {isBg ? BG.noStudentsHint : 'Try changing your search or filter settings.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 xl:grid-cols-3">
          {filteredStudents.map((student) => {
            const status = getStudentStatus(student, needsFocusStudentIds)
            const progressPercent = getProgressPercent(student.completedHours)

            return (
              <article key={student.id} className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 md:flex-1">
                    <p className="truncate text-sm font-semibold text-base-content">{student.name || student.username}</p>
                    <p className="truncate text-xs text-base-content/60">@{student.username || 'user'}</p>
                  </div>
                  <div className="flex justify-start md:justify-end">
                    <span className={statusPillClass[status]}>{statusLabel[status]}</span>
                  </div>
                </div>

                <p className="mt-2 truncate text-xs text-base-content/70">{student.email || (isBg ? BG.noEmail : 'No email')}</p>

                <div className="mt-4">
                  <div className="mb-1 flex items-center justify-between text-xs text-base-content/70">
                    <span>{isBg ? BG.progress : 'Progress'}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <progress className="progress progress-primary h-2.5 w-full" value={progressPercent} max={100} />
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-base-content/75">
                  <span>{isBg ? BG.completedHours : 'Completed hours'}</span>
                  <span className="font-semibold text-base-content">
                    {student.completedHours} / {REQUIRED_HOURS}{isBg ? BG.hourShort : 'h'}
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
