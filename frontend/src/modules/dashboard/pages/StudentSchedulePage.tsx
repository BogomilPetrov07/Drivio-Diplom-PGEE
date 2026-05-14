import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, CalendarX2, CheckCircle2, CircleAlert, CircleCheck, Loader2, Pause, Play, Send, ShieldCheck, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import type { Language } from '../../../i18n/language'
import {
  fetchStudentLessons,
  fetchStudentScheduleCycle,
  submitStudentScheduleAvailability,
  verifyStudentLessonStartCode,
  type DayKey,
  type LessonListItem,
  type LessonSessionState,
  type StudentScheduleCycle,
} from '../api'
import { getRealtimeSocket } from '../realtime'
import { addDays, formatWeekRange, getStartOfWeek } from './instructor-schedule/week'

interface Props { language: Language }
type LessonActionModal =
  | { lessonId: string; mode: 'start' }
type ToastKind = 'success' | 'error'
type ToastItem = {
  id: number
  kind: ToastKind
  message: string
}

const DAY_KEYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const AVAILABILITY_EDITABLE_STATUSES = new Set(['SENT_TO_STUDENTS', 'COLLECTING_RESPONSES', 'READY_TO_ALLOCATE'])
const MIN_SKELETON_MS = 700
const LESSON_START_NOTIFICATION_STORAGE_KEY = 'drivio_pending_start_lesson_id'

function toIsoDate(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

function getEmptyUnavailableSlotKeys() {
  return DAY_KEYS.reduce((acc, key) => {
    acc[key] = []
    return acc
  }, {} as Record<DayKey, string[]>)
}

export default function StudentSchedulePage({ language }: Props) {
  const isBg = language === 'bg'
  const copy = isBg
    ? {
      title: '\u0413\u0440\u0430\u0444\u0438\u043a',
      subtitle: '\u0412\u0438\u0436\u0442\u0435 \u0441\u0435\u0434\u043c\u0438\u0447\u043d\u0438\u044f \u043f\u043b\u0430\u043d, \u043e\u0442\u0431\u0435\u043b\u0435\u0436\u0435\u0442\u0435 \u043d\u0435\u0434\u043e\u0441\u0442\u044a\u043f\u043d\u0438 \u0441\u043b\u043e\u0442\u043e\u0432\u0435 \u0438 \u043f\u043e\u0442\u0432\u044a\u0440\u0434\u0435\u0442\u0435 \u0447\u0430\u0441\u043e\u0432\u0435\u0442\u0435.',
      noCycle: '\u0418\u043d\u0441\u0442\u0440\u0443\u043a\u0442\u043e\u0440\u044a\u0442 \u043e\u0449\u0435 \u043d\u0435 \u0435 \u0438\u0437\u043f\u0440\u0430\u0442\u0438\u043b \u0433\u0440\u0430\u0444\u0438\u043a \u0437\u0430 \u0442\u0430\u0437\u0438 \u0441\u0435\u0434\u043c\u0438\u0446\u0430.',
      cycleStatus: '\u0421\u0442\u0430\u0442\u0443\u0441',
      saveAvailability: '\u0418\u0437\u043f\u0440\u0430\u0442\u0438 \u043d\u0435\u0434\u043e\u0441\u0442\u044a\u043f\u043d\u043e\u0441\u0442',
      savingAvailability: '\u0418\u0437\u043f\u0440\u0430\u0449\u0430\u043d\u0435...',
      savedAt: '\u041f\u043e\u0441\u043b\u0435\u0434\u043d\u043e \u0438\u0437\u043f\u0440\u0430\u0442\u0435\u043d\u043e',
      availabilityLocked: '\u041d\u0435\u0434\u043e\u0441\u0442\u044a\u043f\u043d\u043e\u0441\u0442\u0442\u0430 \u0435 \u0437\u0430\u043a\u043b\u044e\u0447\u0435\u043d\u0430 \u0441\u043b\u0435\u0434 \u0440\u0430\u0437\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u0438\u0435.',
      dayDisabled: '\u041f\u043e\u0447\u0438\u0432\u0435\u043d \u0434\u0435\u043d',
      availableSlot: '\u041d\u0430\u043b\u0438\u0447\u0435\u043d',
      unavailableSlot: '\u041d\u0435\u0434\u043e\u0441\u0442\u044a\u043f\u0435\u043d',
      wholeDayUnavailable: '\u0426\u0435\u043b\u0438\u044f\u0442 \u0434\u0435\u043d \u0435 \u043d\u0435\u0434\u043e\u0441\u0442\u044a\u043f\u0435\u043d',
      lessonsTitle: '\u041c\u043e\u0438\u0442\u0435 \u0443\u0440\u043e\u0446\u0438 \u0437\u0430 \u0441\u0435\u0434\u043c\u0438\u0446\u0430\u0442\u0430',
      lessonsEmpty: '\u041d\u044f\u043c\u0430 \u043f\u043b\u0430\u043d\u0438\u0440\u0430\u043d\u0438 \u0443\u0440\u043e\u0446\u0438.',
      startCodeLabel: '\u041a\u043e\u0434 \u0437\u0430 \u0441\u0442\u0430\u0440\u0442',
      startCodePlaceholder: '\u0412\u044a\u0432\u0435\u0434\u0438 6-\u0446\u0438\u0444\u0440\u0435\u043d \u043a\u043e\u0434',
      verifyCode: '\u041f\u043e\u0442\u0432\u044a\u0440\u0434\u0438 \u043d\u0430\u0447\u0430\u043b\u043e',
      verifyingCode: '\u041f\u043e\u0442\u0432\u044a\u0440\u0436\u0434\u0430\u0432\u0430\u043d\u0435...',
      startCodeRequired: '\u0412\u044a\u0432\u0435\u0434\u0435\u0442\u0435 \u043a\u043e\u0434\u0430, \u043a\u043e\u0439\u0442\u043e \u043f\u043e\u043b\u0443\u0447\u0438\u0445\u0442\u0435 \u043e\u0442 \u0438\u043d\u0441\u0442\u0440\u0443\u043a\u0442\u043e\u0440\u0430.',
      verifyFailed: '\u041d\u0435 \u0443\u0441\u043f\u044f\u0445\u043c\u0435 \u0434\u0430 \u043f\u043e\u0442\u0432\u044a\u0440\u0434\u0438\u043c \u043d\u0430\u0447\u0430\u043b\u043e\u0442\u043e \u043d\u0430 \u0443\u0440\u043e\u043a\u0430.',
      verifySuccess: '\u0423\u0440\u043e\u043a\u044a\u0442 \u0435 \u0441\u0442\u0430\u0440\u0442\u0438\u0440\u0430\u043d.',
      saveAvailabilityFailed: '\u041d\u0435 \u0443\u0441\u043f\u044f\u0445\u043c\u0435 \u0434\u0430 \u0438\u0437\u043f\u0440\u0430\u0442\u0438\u043c \u043d\u0435\u0434\u043e\u0441\u0442\u044a\u043f\u043d\u043e\u0441\u0442\u0442\u0430.',
      saveAvailabilitySuccess: '\u041d\u0435\u0434\u043e\u0441\u0442\u044a\u043f\u043d\u043e\u0441\u0442\u0442\u0430 \u0435 \u0438\u0437\u043f\u0440\u0430\u0442\u0435\u043d\u0430.',
      loading: '\u0417\u0430\u0440\u0435\u0436\u0434\u0430\u043d\u0435...',
      loadError: '\u041d\u0435 \u0443\u0441\u043f\u044f\u0445\u043c\u0435 \u0434\u0430 \u0437\u0430\u0440\u0435\u0434\u0438\u043c \u0433\u0440\u0430\u0444\u0438\u043a\u0430.',
      statusDraft: '\u0427\u0435\u0440\u043d\u043e\u0432\u0430',
      statusSent: '\u0418\u0437\u043f\u0440\u0430\u0442\u0435\u043d',
      statusCollecting: '\u0421\u044a\u0431\u0438\u0440\u0430\u043d\u0435 \u043d\u0430 \u043e\u0442\u0433\u043e\u0432\u043e\u0440\u0438',
      statusReady: '\u0413\u043e\u0442\u043e\u0432 \u0437\u0430 \u0440\u0430\u0437\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u0438\u0435',
      statusAllocated: '\u0420\u0430\u0437\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d',
      statusPublished: '\u041f\u0443\u0431\u043b\u0438\u043a\u0443\u0432\u0430\u043d',
      lessonPlanned: '\u041f\u043b\u0430\u043d\u0438\u0440\u0430\u043d',
      lessonCodeIssued: '\u0418\u0437\u0434\u0430\u0434\u0435\u043d \u043a\u043e\u0434',
      lessonActive: '\u0410\u043a\u0442\u0438\u0432\u0435\u043d',
      lessonEndRequested: '\u041d\u0435\u0443\u0441\u043f\u0435\u0448\u0435\u043d',
      lessonCompleted: '\u041f\u0440\u0438\u043a\u043b\u044e\u0447\u0435\u043d',
      startModalTitle: '\u0412\u044a\u0432\u0435\u0436\u0434\u0430\u043d\u0435 \u043d\u0430 \u043a\u043e\u0434 \u0437\u0430 \u0441\u0442\u0430\u0440\u0442',
      startModalDescription: '\u0412\u044a\u0432\u0435\u0434\u0435\u0442\u0435 6-\u0446\u0438\u0444\u0440\u0435\u043d\u0438\u044f \u043a\u043e\u0434, \u043a\u043e\u0439\u0442\u043e \u0432\u0438 \u043f\u043e\u043a\u0430\u0437\u0430 \u0438\u043d\u0441\u0442\u0440\u0443\u043a\u0442\u043e\u0440\u044a\u0442.',
      cancel: '\u041d\u0430\u0437\u0430\u0434',
      dayNames: {
        monday: '\u041f\u043e\u043d\u0435\u0434\u0435\u043b\u043d\u0438\u043a',
        tuesday: '\u0412\u0442\u043e\u0440\u043d\u0438\u043a',
        wednesday: '\u0421\u0440\u044f\u0434\u0430',
        thursday: '\u0427\u0435\u0442\u0432\u044a\u0440\u0442\u044a\u043a',
        friday: '\u041f\u0435\u0442\u044a\u043a',
        saturday: '\u0421\u044a\u0431\u043e\u0442\u0430',
        sunday: '\u041d\u0435\u0434\u0435\u043b\u044f',
      } as Record<DayKey, string>,
    }
    : {
      title: 'Schedule',
      subtitle: 'Review weekly plan, mark unavailable slots, and confirm lesson start/end actions.',
      noCycle: 'Your instructor has not sent a schedule for this week yet.',
      cycleStatus: 'Status',
      saveAvailability: 'Submit availability',
      savingAvailability: 'Submitting...',
      savedAt: 'Last submitted',
      availabilityLocked: 'Availability is locked after allocation.',
      dayDisabled: 'Day off',
      availableSlot: 'Available',
      unavailableSlot: 'Unavailable',
      wholeDayUnavailable: 'Unavailable for whole day',
      lessonsTitle: 'My lessons this week',
      lessonsEmpty: 'No planned lessons for this week.',
      startCodeLabel: 'Start code',
      startCodePlaceholder: 'Enter 6-digit code',
      verifyCode: 'Verify start',
      verifyingCode: 'Verifying...',
      startCodeRequired: 'Enter the code from your instructor.',
      verifyFailed: 'Could not verify lesson start code.',
      verifySuccess: 'Lesson started successfully.',
      saveAvailabilityFailed: 'Could not submit availability.',
      saveAvailabilitySuccess: 'Availability submitted.',
      loading: 'Loading...',
      loadError: 'Could not load schedule.',
      statusDraft: 'Draft',
      statusSent: 'Sent',
      statusCollecting: 'Collecting responses',
      statusReady: 'Ready to allocate',
      statusAllocated: 'Allocated',
      statusPublished: 'Published',
      lessonPlanned: 'Planned',
      lessonCodeIssued: 'Start code issued',
      lessonActive: 'Active',
      lessonEndRequested: 'Failed',
      lessonCompleted: 'Completed',
      startModalTitle: 'Enter lesson start code',
      startModalDescription: 'Enter the 6-digit code shown by your instructor.',
      cancel: 'Back',
      dayNames: {
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday',
      } as Record<DayKey, string>,
    }

  const [searchParams, setSearchParams] = useSearchParams()
  const [weekStartDate] = useState<Date>(() => getStartOfWeek(new Date()))
  const [schedule, setSchedule] = useState<StudentScheduleCycle | null>(null)
  const [lessons, setLessons] = useState<LessonListItem[]>([])
  const [unavailableSlotKeys, setUnavailableSlotKeys] = useState<Record<DayKey, string[]>>(getEmptyUnavailableSlotKeys)
  const [codeInput, setCodeInput] = useState('')
  const [highlightedLessonId, setHighlightedLessonId] = useState<string | null>(null)
  const [lessonActionModal, setLessonActionModal] = useState<LessonActionModal | null>(null)
  const [loading, setLoading] = useState(true)
  const [submittingAvailability, setSubmittingAvailability] = useState(false)
  const [verifyingLessonId, setVerifyingLessonId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const lessonCardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const loadWeekData = useCallback(async (targetWeek: Date, options?: { silent?: boolean }) => {
    const isSilent = Boolean(options?.silent)
    const loadStartedAt = Date.now()
    if (!isSilent) {
      setLoading(true)
      setError('')
    }

    try {
      const weekStart = toIsoDate(targetWeek)
      const [scheduleData, lessonRows] = await Promise.all([
        fetchStudentScheduleCycle(weekStart),
        fetchStudentLessons(weekStart),
      ])

      setSchedule(scheduleData)
      setLessons(lessonRows)
      setUnavailableSlotKeys(scheduleData?.reply.unavailableSlotKeys ?? getEmptyUnavailableSlotKeys())
    } catch {
      if (!isSilent) {
        setError(copy.loadError)
      }
    } finally {
      if (!isSilent) {
        const elapsed = Date.now() - loadStartedAt
        const remainingDelay = Math.max(0, MIN_SKELETON_MS - elapsed)
        if (remainingDelay > 0) {
          await new Promise((resolve) => window.setTimeout(resolve, remainingDelay))
        }
        setLoading(false)
      }
    }
  }, [copy.loadError])

  const pushToast = useCallback((kind: ToastKind, message: string) => {
    if (!message) return
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((current) => [...current, { id, kind, message }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4200)
  }, [])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadWeekData(weekStartDate)
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [loadWeekData, weekStartDate])

  useEffect(() => {
    if (!error) return
    const timeoutId = window.setTimeout(() => {
      pushToast('error', error)
      setError('')
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [error, pushToast])

  useEffect(() => {
    if (!success) return
    const timeoutId = window.setTimeout(() => {
      pushToast('success', success)
      setSuccess('')
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [success, pushToast])

  useEffect(() => {
    const slotFromQuery = searchParams.get('startLessonId')
    const slotFromStorage = sessionStorage.getItem(LESSON_START_NOTIFICATION_STORAGE_KEY)
    const slotId = slotFromQuery || slotFromStorage
    if (!slotId) return

    const timeoutId = window.setTimeout(() => {
      setHighlightedLessonId(slotId)
      sessionStorage.removeItem(LESSON_START_NOTIFICATION_STORAGE_KEY)

      if (slotFromQuery) {
        const next = new URLSearchParams(searchParams)
        next.delete('startLessonId')
        setSearchParams(next, { replace: true })
      }
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [searchParams, setSearchParams])

  const canSubmitAvailability = Boolean(
    schedule && AVAILABILITY_EDITABLE_STATUSES.has(schedule.cycle.status),
  )
  const lessonsForWeek = useMemo(() => {
    if (lessons.length > 0) return lessons
    if (!schedule) return []
    return schedule.assignedSlots as LessonListItem[]
  }, [lessons, schedule])

  const resolveLessonDayKey = useCallback((lesson: LessonListItem): DayKey => {
    if (lesson.dayKey && DAY_KEYS.includes(lesson.dayKey as DayKey)) {
      return lesson.dayKey as DayKey
    }
    const day = new Date(lesson.startTime).getDay()
    const byIndex: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return byIndex[day] || 'monday'
  }, [])

  const lessonsByDay = useMemo(() => {
    const grouped = DAY_KEYS.reduce((acc, dayKey) => {
      acc[dayKey] = []
      return acc
    }, {} as Record<DayKey, LessonListItem[]>)

    for (const lesson of lessonsForWeek) {
      grouped[resolveLessonDayKey(lesson)].push(lesson)
    }

    for (const dayKey of DAY_KEYS) {
      grouped[dayKey].sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
    }

    return grouped
  }, [lessonsForWeek, resolveLessonDayKey])

  const activeMaxLessonsPerDay = useMemo(
    () => DAY_KEYS.reduce((max, dayKey) => Math.max(max, lessonsByDay[dayKey].length), 0),
    [lessonsByDay],
  )
  const activeColumnRows = Math.max(1, activeMaxLessonsPerDay)
  const activeColumnMinHeight = useMemo(
    () => `calc(${activeColumnRows} * 2.25rem + ${Math.max(0, activeColumnRows - 1)} * 0.375rem)`,
    [activeColumnRows],
  )

  useEffect(() => {
    if (!highlightedLessonId) return
    const lesson = lessonsForWeek.find((item) => item.id === highlightedLessonId)
    if (!lesson) return

    const card = lessonCardRefs.current[highlightedLessonId]
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' })

    if (lesson.state === 'START_CODE_ISSUED') {
      const timeoutId = window.setTimeout(() => {
        setLessonActionModal({ lessonId: lesson.id, mode: 'start' })
      }, 0)
      return () => window.clearTimeout(timeoutId)
    }
  }, [highlightedLessonId, lessonsForWeek])

  const toggleSlotAvailability = (dayKey: DayKey, slotKey: string) => {
    if (!canSubmitAvailability) return
    setUnavailableSlotKeys((current) => {
      const daySlots = current[dayKey] ?? []
      const exists = daySlots.includes(slotKey)
      return {
        ...current,
        [dayKey]: exists ? daySlots.filter((item) => item !== slotKey) : [...daySlots, slotKey],
      }
    })
  }

  const toggleWholeDayUnavailable = (dayKey: DayKey, daySlotKeys: string[], checked: boolean) => {
    if (!canSubmitAvailability) return
    setUnavailableSlotKeys((current) => ({
      ...current,
      [dayKey]: checked ? Array.from(new Set(daySlotKeys)) : [],
    }))
  }

  useEffect(() => {
    const socket = getRealtimeSocket()

    const onScheduleChanged = () => {
      void loadWeekData(weekStartDate, { silent: true })
    }

    socket.on('schedule:changed', onScheduleChanged)
    return () => {
      socket.off('schedule:changed', onScheduleChanged)
    }
  }, [loadWeekData, weekStartDate])

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void loadWeekData(weekStartDate, { silent: true })
    }, 7000)

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadWeekData(weekStartDate, { silent: true })
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [loadWeekData, weekStartDate])

  const handleSubmitAvailability = async () => {
    if (!schedule || !canSubmitAvailability) return
    setSubmittingAvailability(true)
    setError('')
    setSuccess('')

    try {
      await submitStudentScheduleAvailability({
        cycleId: schedule.cycle.id,
        unavailableSlotKeys,
      })
      setSuccess(copy.saveAvailabilitySuccess)
      await loadWeekData(weekStartDate)
    } catch {
      setError(copy.saveAvailabilityFailed)
    } finally {
      setSubmittingAvailability(false)
    }
  }

  const handleVerifyStartCode = async (lessonId: string) => {
    const code = codeInput.trim()
    if (!code) {
      setError(copy.startCodeRequired)
      return
    }

    setVerifyingLessonId(lessonId)
    setError('')
    setSuccess('')

    try {
      await verifyStudentLessonStartCode(lessonId, code)
      setSuccess(copy.verifySuccess)
      setHighlightedLessonId(null)
      setCodeInput('')
      setLessonActionModal(null)
      await loadWeekData(weekStartDate)
    } catch {
      setError(copy.verifyFailed)
    } finally {
      setVerifyingLessonId(null)
    }
  }

  const locale = isBg ? 'bg-BG' : 'en-US'
  const weekTitle = isBg ? '\u0421\u0435\u0434\u043c\u0438\u0446\u0430' : 'Week'
  const dayOffTitle = isBg ? '\u041f\u043e\u0447\u0438\u0432\u0435\u043d \u0434\u0435\u043d' : 'Day Off'
  const dayOffHint = isBg ? '\u0417\u0430 \u0442\u043e\u0437\u0438 \u0434\u0435\u043d \u043d\u044f\u043c\u0430 \u0441\u043b\u043e\u0442\u043e\u0432\u0435.' : 'No slots for this day.'
  const noLessonForDayTitle = isBg ? '\u0411\u0435\u0437 \u0447\u0430\u0441\u043e\u0432\u0435' : 'No lessons'
  const noLessonForDayHint = isBg ? '\u041d\u044f\u043c\u0430\u0442\u0435 \u0434\u0430\u0434\u0435\u043d\u0438 \u0447\u0430\u0441\u043e\u0432\u0435 \u0432 \u0442\u043e\u0437\u0438 \u0434\u0435\u043d' : 'You have no assigned lessons for this day'
  const showLessonsInsideWeekGrid = !canSubmitAvailability
  const lessonRowStyleByState: Record<LessonSessionState, string> = {
    PLANNED: 'border-emerald-500/70 bg-emerald-500/85 text-emerald-950',
    START_CODE_ISSUED: 'border-cyan-400/85 bg-cyan-400/90 text-cyan-950',
    ACTIVE: 'border-sky-400/85 bg-sky-400/90 text-sky-950',
    FAILED: 'border-error/80 bg-error/75 text-error-content',
    COMPLETED: 'border-amber-300/85 bg-amber-300 text-amber-950',
  }

  const lessonStateIcon = (state: LessonSessionState) => {
    if (state === 'START_CODE_ISSUED') return <ShieldCheck className="h-3.5 w-3.5" />
    if (state === 'ACTIVE') return <Pause className="h-3.5 w-3.5" />
    if (state === 'FAILED') return <X className="h-3.5 w-3.5" />
    if (state === 'COMPLETED') return <CheckCircle2 className="h-3.5 w-3.5" />
    return <Play className="h-3.5 w-3.5" />
  }

  return (
    <section className="space-y-3 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-3 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)] sm:space-y-4 sm:p-5 lg:p-6">
      <div className="rounded-2xl border border-base-content/15 bg-base-100/60 p-3 sm:p-4">
        <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
          {isBg ? 'Активно седмично разписание' : 'Active Weekly Timetable'}
        </h2>
        <div className="mt-3 grid items-center gap-2 rounded-xl border border-base-content/15 bg-base-100/55 px-3 py-2 md:grid-cols-[1fr_auto_1fr]">
          <div />
          <div className="inline-flex items-center gap-1.5 sm:gap-2 justify-self-center">
            <span className="min-w-0 text-center text-xl font-semibold text-base-content sm:min-w-72">{formatWeekRange(weekStartDate)}</span>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-sm btn-primary"
              disabled={!canSubmitAvailability || submittingAvailability}
              onClick={() => void handleSubmitAvailability()}
            >
              {submittingAvailability ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submittingAvailability ? copy.savingAvailability : copy.saveAvailability}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <article key={`student-schedule-skeleton-${index}`} className="rounded-xl border border-base-300 bg-base-100/90 p-4">
              <div className="skeleton h-4 w-2/3 rounded-md" />
              <div className="mt-2 skeleton h-3.5 w-1/2 rounded-md" />
              <div className="mt-4 skeleton h-8 w-full rounded-lg" />
            </article>
          ))}
        </div>
      ) : !schedule ? (
        <div className="rounded-xl border border-dashed border-base-300 bg-base-100/70 px-4 py-8 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-base-content/45" />
          <p className="mt-3 text-sm font-semibold text-base-content">{copy.noCycle}</p>
        </div>
      ) : (
        <>

          <div className="rounded-xl border border-base-300/70 bg-base-100/80 p-4">
            <div className="mb-2 rounded-xl border border-base-content/10 bg-base-100/55 px-3 py-2.5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-base-content/65">
                {isBg ? 'Легенда' : 'Legend'}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-emerald-500/70 bg-emerald-500/85 px-3 text-xs font-medium text-emerald-950">
                  <Play className="h-3.5 w-3.5" />
                  {copy.lessonPlanned}
                </span>
                <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-cyan-400/80 bg-cyan-400/90 px-3 text-xs font-medium text-cyan-950">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {copy.lessonCodeIssued}
                </span>
                <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-sky-400/85 bg-sky-400/90 px-3 text-xs font-medium text-sky-950">
                  <Pause className="h-3.5 w-3.5" />
                  {copy.lessonActive}
                </span>
                <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-orange-400/80 bg-orange-400/90 px-3 text-xs font-medium text-orange-950">
                  <X className="h-3.5 w-3.5" />
                  {copy.lessonEndRequested}
                </span>
                <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-amber-300/85 bg-amber-300 px-3 text-xs font-medium text-amber-950">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {copy.lessonCompleted}
                </span>
              </div>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-base-content">{isBg ? 'Уроци за седмицата' : 'Lessons for the week'}</h3>
            <h3 className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-base-content/70">{weekTitle}</h3>
            <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-2 xl:grid-cols-7">
              {DAY_KEYS.map((dayKey, dayIndex) => {
                const day = schedule.days[dayKey]
                const daySlots = schedule.slotBlueprint[dayKey] ?? []
                const blockedSlots = (day.blockedLessonKeys ?? [])
                  .map((key) => {
                    const [startTime, endTime] = key.split('-')
                    if (!startTime || !endTime) return null
                    return { key, startTime, endTime, blocked: true as const }
                  })
                  .filter((slot): slot is { key: string; startTime: string; endTime: string; blocked: true } => Boolean(slot))
                const plannedSlots = daySlots.map((slot) => ({ ...slot, blocked: false as const }))
                const displaySlots = [...plannedSlots, ...blockedSlots]
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .filter((slot, idx, arr) => arr.findIndex((x) => x.key === slot.key) === idx)
                const date = addDays(weekStartDate, dayIndex)
                const dateLabel = date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })

                return (
                  <article
                    key={dayKey}
                    className={`min-w-0 rounded-xl border p-2 flex flex-col xl:h-full ${
                      day.enabled && displaySlots.length > 0
                        ? 'border-base-300 bg-base-100'
                        : 'border-base-300/60 bg-base-200/40'
                    }`}
                  >
                    <div className="text-center font-semibold leading-tight text-base-content">
                      <p className="text-xs">{copy.dayNames[dayKey]}</p>
                      <p className="mt-0.5 whitespace-nowrap text-[10px] font-medium text-base-content/60">{dateLabel}</p>
                    </div>

                    {day.enabled && displaySlots.length > 0 ? (
                      showLessonsInsideWeekGrid ? (
                        <div className="mt-2 space-y-1 pr-0.5" style={{ minHeight: activeColumnMinHeight }}>
                          {lessonsByDay[dayKey].length === 0 ? (
                            <div className="h-full rounded-xl border border-dashed border-base-300/80 bg-gradient-to-b from-base-100/30 to-base-200/20 px-3 py-6 xl:h-full">
                              <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
                                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-base-300/70 bg-base-300/20">
                                  <CalendarX2 className="h-5 w-5 text-base-content/60" />
                                </div>
                                <p className="text-base font-semibold text-base-content/80">{noLessonForDayTitle}</p>
                                <p className="mt-1 text-xs text-base-content/55">{noLessonForDayHint}</p>
                              </div>
                            </div>
                          ) : lessonsByDay[dayKey].map((lesson) => {
                            const start = new Date(lesson.startTime)
                            const end = new Date(lesson.endTime)
                            const timeLabel = `${start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`
                            const isHighlightedLesson = highlightedLessonId === lesson.id

                            return (
                              <div
                                key={lesson.id}
                                ref={(node) => {
                                  lessonCardRefs.current[lesson.id] = node
                                }}
                                className={`h-[clamp(30px,2.3vw,36px)] w-full rounded-md border px-[clamp(4px,0.4vw,6px)] ${lessonRowStyleByState[lesson.state]} ${isHighlightedLesson ? 'ring-2 ring-primary/60' : ''} ${lesson.state === 'START_CODE_ISSUED' ? 'cursor-pointer' : 'cursor-default'}`}
                                onClick={() => {
                                  setHighlightedLessonId(lesson.id)
                                  if (lesson.state === 'START_CODE_ISSUED') {
                                    setCodeInput('')
                                    setLessonActionModal({ lessonId: lesson.id, mode: 'start' })
                                  }
                                }}
                              >
                                <div className="grid h-full grid-cols-[18px_minmax(0,1fr)] items-center gap-2">
                                  <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-md border border-base-content/25 bg-base-100/20">
                                    {lessonStateIcon(lesson.state)}
                                  </span>
                                  <span className="min-w-0 truncate whitespace-nowrap text-[clamp(10px,0.82vw,12px)] font-semibold leading-none tracking-tight tabular-nums">
                                    {timeLabel}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="mt-2 space-y-1 pr-0.5">
                          <label className="mb-1 inline-flex w-full cursor-pointer items-center gap-2 rounded-md border border-base-300/70 bg-base-100/80 px-2 py-1.5 text-[11px] font-medium text-base-content/80">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-xs"
                              disabled={!canSubmitAvailability}
                              checked={daySlots.length > 0 && (unavailableSlotKeys[dayKey] ?? []).length >= daySlots.length}
                              onChange={(event) => toggleWholeDayUnavailable(dayKey, daySlots.map((slot) => slot.key), event.target.checked)}
                            />
                            <span>{copy.wholeDayUnavailable}</span>
                          </label>
                          {displaySlots.map((slot) => {
                            const isUnavailable = (unavailableSlotKeys[dayKey] ?? []).includes(slot.key)
                            const isBlocked = slot.blocked
                            return (
                              <button
                                key={`${dayKey}-${slot.key}`}
                                type="button"
                                className={`h-[clamp(24px,3vh,40px)] w-full text-left flex items-center rounded-md border px-2 py-0.5 shadow-sm transition ${
                                  isBlocked
                                    ? 'border-base-300/80 bg-base-300/45 text-base-content/65'
                                    : isUnavailable
                                    ? 'border-error/80 bg-error/75 text-error-content opacity-90'
                                    : 'border-success/80 bg-success/95 text-success-content'
                                } ${(canSubmitAvailability && !isBlocked) ? '' : 'cursor-not-allowed opacity-70'}`}
                                disabled={!canSubmitAvailability || isBlocked}
                                onClick={() => toggleSlotAvailability(dayKey, slot.key)}
                              >
                                <span className="w-full truncate whitespace-nowrap text-[10px] leading-tight font-semibold sm:text-[11px]">
                                  {slot.startTime} - {slot.endTime}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )
                    ) : (
                      <div className="mt-2 rounded-xl border border-dashed border-base-300/80 bg-gradient-to-b from-base-100/30 to-base-200/20 px-3 py-6 xl:h-full">
                        <div className="flex h-full min-h-[180px] flex-col items-center justify-center text-center">
                          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-base-300/70 bg-base-300/20">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-5 w-5 text-base-content/60"
                            >
                              <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
                              <rect x="4" y="7" width="16" height="12" rx="2.5" />
                              <path d="M4 12h16" />
                            </svg>
                          </div>
                          <p className="text-base font-semibold text-base-content/80">{dayOffTitle}</p>
                          <p className="mt-1 text-xs text-base-content/55">{dayOffHint}</p>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </div>
        </>
      )}

      {lessonActionModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-xl border border-base-content/20 bg-base-100 p-4 shadow-xl">
            <p className="text-base font-semibold text-base-content">{copy.startModalTitle}</p>
            <p className="mt-1.5 text-sm text-base-content/75">{copy.startModalDescription}</p>

            <div className="mt-3 space-y-2">
              <label className="input input-bordered flex h-10 items-center gap-2 rounded-md border-base-300 bg-base-100/90 px-3">
                <ShieldCheck className="h-4 w-4 text-base-content/60" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={codeInput}
                  onChange={(event) => setCodeInput(event.target.value)}
                  placeholder={copy.startCodePlaceholder}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setLessonActionModal(null)}
              >
                {copy.cancel}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                disabled={verifyingLessonId === lessonActionModal.lessonId}
                onClick={() => void handleVerifyStartCode(lessonActionModal.lessonId)}
              >
                {verifyingLessonId === lessonActionModal.lessonId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {verifyingLessonId === lessonActionModal.lessonId ? copy.verifyingCode : copy.verifyCode}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toasts.length > 0 ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-[min(92vw,420px)] flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="pointer-events-auto overflow-hidden rounded-lg border border-white/10 bg-zinc-800/95 text-zinc-100 shadow-xl backdrop-blur-sm"
            >
              <div className="flex items-start gap-3 p-3">
                <div className={`mt-0.5 ${toast.kind === 'success' ? 'text-success' : 'text-error'}`}>
                  {toast.kind === 'success' ? <CircleCheck className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}
                </div>
                <p className="flex-1 text-sm font-medium">{toast.message}</p>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs h-6 min-h-6 w-6 p-0 text-zinc-300 hover:text-zinc-100"
                  onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className={`h-1 ${toast.kind === 'success' ? 'bg-success/90' : 'bg-error/90'}`} />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}
