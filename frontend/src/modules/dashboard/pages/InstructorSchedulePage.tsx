import { useCallback, useEffect, useMemo, useState } from 'react'
import { Ban, BriefcaseBusiness, CheckCircle2, CircleAlert, CircleCheck, Loader2, Pause, Play, Send, User, UserX, X } from 'lucide-react'
import type { Language } from '../../../i18n/language'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import {
  allocateInstructorSchedule,
  fetchInstructorLessons,
  fetchInstructorLessonCandidates,
  fetchInstructorSchedule,
  fetchInstructorScheduleWorkflow,
  issueInstructorLessonStartCode,
  markInstructorLessonFailed,
  saveInstructorSchedule,
  sendInstructorScheduleToStudents,
  type DayKey as ApiDayKey,
  type InstructorSchedule,
  type InstructorScheduleCycle,
  type InstructorScheduleWorkflow,
  type LessonListItem,
  type LessonCandidatesDetails,
  type ScheduleSlotBlueprint,
} from '../api'
import { getRealtimeSocket } from '../realtime'
import { ScheduleControls } from './instructor-schedule/ScheduleControls'
import { WeeklySlots } from './instructor-schedule/WeeklySlots'
import { clampTime, computeBreakMinutesByPreset, generateSlots, toMinutes } from './instructor-schedule/logic'
import { DAY_OPTIONS } from './instructor-schedule/constants'
import type { BreakPreset, DayKey, WeekScheduleDays } from './instructor-schedule/types'
import { addDays, formatWeekRange, getStartOfWeek } from './instructor-schedule/week'

interface Props {
  language: Language
  mode?: 'planner' | 'active'
}

const MIN_SKELETON_MS = 900
const DAY_LABELS_BG: Record<DayKey, string> = {
  monday: '\u041f\u043e\u043d\u0435\u0434\u0435\u043b\u043d\u0438\u043a',
  tuesday: '\u0412\u0442\u043e\u0440\u043d\u0438\u043a',
  wednesday: '\u0421\u0440\u044f\u0434\u0430',
  thursday: '\u0427\u0435\u0442\u0432\u044a\u0440\u0442\u044a\u043a',
  friday: '\u041f\u0435\u0442\u044a\u043a',
  saturday: '\u0421\u044a\u0431\u043e\u0442\u0430',
  sunday: '\u041d\u0435\u0434\u0435\u043b\u044f',
}
const DAY_LABELS_EN: Record<DayKey, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}
const LESSON_DAY_KEYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

type StartCodeModalState = {
  slotId: string
  code: string
  expiresAt: string
}

type LessonInfoModalState = {
  slotId: string
  timeLabel: string
}

type ToastKind = 'success' | 'error'
type ToastItem = {
  id: number
  kind: ToastKind
  message: string
}

function getEmptyWeekDays(): WeekScheduleDays {
  return DAY_OPTIONS.reduce((acc, day) => {
    const key = day.key as DayKey
    acc[key] = {
      enabled: false,
      startTime: '09:00',
      endTime: '17:00',
      blockedLessonKeys: [],
    }
    return acc
  }, {} as WeekScheduleDays)
}

function getDraftWeekDays(): WeekScheduleDays {
  return {
    monday: { enabled: true, startTime: '09:00', endTime: '17:00', blockedLessonKeys: [] },
    tuesday: { enabled: true, startTime: '09:00', endTime: '17:00', blockedLessonKeys: [] },
    wednesday: { enabled: true, startTime: '09:00', endTime: '17:00', blockedLessonKeys: [] },
    thursday: { enabled: true, startTime: '09:00', endTime: '17:00', blockedLessonKeys: [] },
    friday: { enabled: true, startTime: '09:00', endTime: '17:00', blockedLessonKeys: [] },
    saturday: { enabled: false, startTime: '09:00', endTime: '17:00', blockedLessonKeys: [] },
    sunday: { enabled: false, startTime: '09:00', endTime: '17:00', blockedLessonKeys: [] },
  }
}

function getAllDaysLocked() {
  return DAY_OPTIONS.reduce((acc, day) => {
    acc[day.key as DayKey] = true
    return acc
  }, {} as Record<DayKey, boolean>)
}

function deriveGlobalTimesFromDays(days: WeekScheduleDays) {
  const enabledDays = DAY_OPTIONS
    .map((day) => day.key as DayKey)
    .filter((key) => days[key].enabled)

  const sourceKey = enabledDays[0] ?? ('monday' as DayKey)
  return {
    startTime: days[sourceKey]?.startTime || '09:00',
    endTime: days[sourceKey]?.endTime || '17:00',
  }
}

function toIsoDate(value: Date) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

function mapCycleDays(cycle: InstructorScheduleCycle | null) {
  if (!cycle?.days) return null
  return cycle.days as WeekScheduleDays
}

function buildSlotBlueprint(
  days: WeekScheduleDays,
  breakPreset: BreakPreset,
  customBreakMinutes: number,
  customLessonSpan: number,
): ScheduleSlotBlueprint {
  const blueprint = DAY_OPTIONS.reduce((acc, day) => {
    acc[day.key as ApiDayKey] = []
    return acc
  }, {} as ScheduleSlotBlueprint)

  for (const dayOption of DAY_OPTIONS) {
    const dayKey = dayOption.key as DayKey
    const day = days[dayKey]
    if (!day.enabled) continue

    const computedBreak = computeBreakMinutesByPreset(
      day.startTime,
      day.endTime,
      breakPreset,
      { breakMinutes: customBreakMinutes, lessonSpan: customLessonSpan },
    )

    const blocked = new Set(day.blockedLessonKeys)
    const slots = generateSlots(day.startTime, day.endTime, computedBreak, breakPreset)
      .map((slot) => ({
        key: `${slot.start}-${slot.end}`,
        startTime: slot.start,
        endTime: slot.end,
      }))
      .filter((slot) => !blocked.has(slot.key))

    blueprint[dayKey as ApiDayKey] = slots
  }

  return blueprint
}

function ScheduleLoadingSkeleton({ language }: { language: Language }) {
  const isBg = language === 'bg'
  const t = getDashboardTranslations(language).pages.instructorSchedule

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-base-300 bg-gradient-to-b from-base-100 to-base-200/40 p-4 sm:p-5">
      <div className="rounded-xl border border-base-300/80 bg-base-100/80 p-4">
        <p className="text-sm font-semibold text-base-content">{t.emptyScheduleTitle}</p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
        {DAY_OPTIONS.map((day) => (
          <article key={day.key} className="rounded-xl border border-base-300/70 bg-base-100 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-base-content/80">{isBg ? day.labelBg : day.labelEn}</p>
              <span className="badge badge-ghost badge-xs">{t.emptyBadge}</span>
            </div>
            <div className="mt-3 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-4 w-5/6" />
              <div className="skeleton h-4 w-2/3" />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function ScheduleEmptyStatic({ language }: { language: Language }) {
  const isBg = language === 'bg'
  const t = getDashboardTranslations(language).pages.instructorSchedule

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-base-300 bg-gradient-to-b from-base-100 to-base-200/40 p-4 sm:p-5">
      <div className="rounded-xl border border-base-300/80 bg-base-100/80 p-4">
        <p className="text-sm font-semibold text-base-content">{t.emptyScheduleTitle}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
        {DAY_OPTIONS.map((day) => (
          <article key={day.key} className="rounded-xl border border-base-300/70 bg-base-100 p-3">
            <div className="flex items-center justify-center">
              <p className="text-xs font-semibold text-base-content/80">{isBg ? day.labelBg : day.labelEn}</p>
            </div>
            <div className="mt-3 rounded-xl border border-dashed border-base-300/70 bg-gradient-to-b from-base-100/10 to-base-200/20 p-3">
              <div className="flex flex-col items-center justify-center py-2 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-base-300/70 bg-base-300/20">
                  <Ban className="h-5 w-5 text-base-content/60" />
                </div>
                <p className="text-lg font-semibold leading-tight text-base-content/85">
                  {t.noAvailableSchedule}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default function InstructorSchedulePage({ language, mode = 'planner' }: Props) {
  const isBg = language === 'bg'
  const t = getDashboardTranslations(language).pages.instructorSchedule

  const copy = isBg
    ? {
      replies: '\u041e\u0442\u0433\u043e\u0432\u043e\u0440\u0438',
      cycleStatus: '\u0421\u0442\u0430\u0442\u0443\u0441 \u043d\u0430 \u0446\u0438\u043a\u044a\u043b\u0430',
      workflowLoading: '\u0417\u0430\u0440\u0435\u0436\u0434\u0430\u043d\u0435 \u043d\u0430 workflow...',
      workflowLoadFailed: '\u041d\u0435 \u0443\u0441\u043f\u044f\u0445\u043c\u0435 \u0434\u0430 \u0437\u0430\u0440\u0435\u0434\u0438\u043c workflow \u0434\u0430\u043d\u043d\u0438\u0442\u0435.',
      sendAgain: '\u0418\u0437\u043f\u0440\u0430\u0442\u0438 \u043e\u0442\u043d\u043e\u0432\u043e',
      sending: '\u0418\u0437\u043f\u0440\u0430\u0449\u0430\u043d\u0435...',
      allocate: '\u0420\u0430\u0437\u043f\u0440\u0435\u0434\u0435\u043b\u0438 \u0447\u0430\u0441\u043e\u0432\u0435\u0442\u0435',
      allocating: '\u0420\u0430\u0437\u043f\u0440\u0435\u0434\u0435\u043b\u044f\u043d\u0435...',
      allocationHint: '\u041f\u0440\u0435\u0434\u0438 \u0440\u0430\u0437\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u0438\u0435 \u0442\u0440\u044f\u0431\u0432\u0430 \u0434\u0430 \u0438\u043c\u0430 \u043e\u0442\u0433\u043e\u0432\u043e\u0440 \u043e\u0442 \u0432\u0441\u0438\u0447\u043a\u0438 \u0430\u043a\u0442\u0438\u0432\u043d\u0438 \u043a\u0443\u0440\u0441\u0438\u0441\u0442\u0438.',
      noCycle: '\u041d\u044f\u043c\u0430 \u0438\u0437\u043f\u0440\u0430\u0442\u0435\u043d \u0446\u0438\u043a\u044a\u043b \u0437\u0430 \u0442\u0430\u0437\u0438 \u0441\u0435\u0434\u043c\u0438\u0446\u0430.',
      sendSuccess: '\u0413\u0440\u0430\u0444\u0438\u043a\u044a\u0442 \u0435 \u0438\u0437\u043f\u0440\u0430\u0442\u0435\u043d \u043a\u044a\u043c \u043a\u0443\u0440\u0441\u0438\u0441\u0442\u0438\u0442\u0435.',
      sendFailed: '\u0418\u043c\u0430 \u043f\u0440\u043e\u0431\u043b\u0435\u043c \u043f\u0440\u0438 \u0438\u0437\u043f\u0440\u0430\u0449\u0430\u043d\u0435\u0442\u043e \u043d\u0430 \u0433\u0440\u0430\u0444\u0438\u043a\u0430.',
      allocateSuccess: (assigned: number, total: number, unassigned: number) =>
        `\u0420\u0430\u0437\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u0438 \u0441\u0430 ${assigned}/${total} \u0441\u043b\u043e\u0442\u0430. \u041d\u0435\u0440\u0430\u0437\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u0438: ${unassigned}.`,
      allocateFailed: '\u041d\u0435 \u0443\u0441\u043f\u044f\u0445\u043c\u0435 \u0434\u0430 \u0441\u0442\u0430\u0440\u0442\u0438\u0440\u0430\u043c\u0435 \u0440\u0430\u0437\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u0438\u0435\u0442\u043e.',
      copyPreviousMissing: '\u041d\u044f\u043c\u0430 \u0446\u0438\u043a\u044a\u043b \u0437\u0430 \u043f\u0440\u0435\u0434\u0438\u0448\u043d\u0430\u0442\u0430 \u0441\u0435\u0434\u043c\u0438\u0446\u0430.',
      copyPreviousDone: '\u041a\u043e\u043f\u0438\u0440\u0430\u0445\u043c\u0435 \u043a\u043e\u043d\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044f\u0442\u0430 \u043e\u0442 \u043f\u0440\u0435\u0434\u0438\u0448\u043d\u0430\u0442\u0430 \u0441\u0435\u0434\u043c\u0438\u0446\u0430.',
      copyPreviousFailed: '\u041d\u0435 \u0443\u0441\u043f\u044f\u0445\u043c\u0435 \u0434\u0430 \u043a\u043e\u043f\u0438\u0440\u0430\u043c\u0435 \u043f\u0440\u0435\u0434\u0438\u0448\u043d\u0430\u0442\u0430 \u0441\u0435\u0434\u043c\u0438\u0446\u0430.',
      lessonsTitle: '\u0423\u0440\u043e\u0446\u0438 \u0437\u0430 \u0441\u0435\u0434\u043c\u0438\u0446\u0430\u0442\u0430',
      lessonsEmpty: '\u041d\u044f\u043c\u0430 \u0440\u0430\u0437\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d\u0438 \u0443\u0440\u043e\u0446\u0438 \u0437\u0430 \u0442\u0430\u0437\u0438 \u0441\u0435\u0434\u043c\u0438\u0446\u0430.',
      unassigned: '\u041d\u0435\u0440\u0430\u0437\u043f\u0440\u0435\u0434\u0435\u043b\u0435\u043d',
      startLesson: '\u0417\u0430\u043f\u043e\u0447\u043d\u0438 \u0447\u0430\u0441\u0430',
      confirmStartTitle: '\u0421\u0438\u0433\u0443\u0440\u0435\u043d \u043b\u0438 \u0441\u0438?',
      confirmStartDescription: '\u041a\u043e\u0434\u044a\u0442 \u0437\u0430 \u0441\u0442\u0430\u0440\u0442 \u0449\u0435 \u0431\u044a\u0434\u0435 \u0438\u0437\u043f\u0440\u0430\u0442\u0435\u043d \u043a\u044a\u043c \u043a\u0443\u0440\u0441\u0438\u0441\u0442\u0430 \u0432\u0435\u0434\u043d\u0430\u0433\u0430.',
      back: '\u041d\u0430\u0437\u0430\u0434',
      requestEnd: '\u041c\u0430\u0440\u043a\u0438\u0440\u0430\u0439 \u043d\u0435\u0443\u0441\u043f\u0435\u0448\u0435\u043d',
      confirmEndTitle: '\u0421\u0438\u0433\u0443\u0440\u0435\u043d \u043b\u0438 \u0441\u0438?',
      confirmEndDescription: '\u0427\u0430\u0441\u044a\u0442 \u0449\u0435 \u0431\u044a\u0434\u0435 \u043c\u0430\u0440\u043a\u0438\u0440\u0430\u043d \u043a\u0430\u0442\u043e \u043d\u0435\u0443\u0441\u043f\u0435\u0448\u043d\u043e \u043f\u0440\u043e\u0432\u0435\u0434\u0435\u043d.',
      waitingStudentEnd: '\u0427\u0430\u043a\u0430 \u043f\u043e\u0442\u0432\u044a\u0440\u0436\u0434\u0435\u043d\u0438\u0435 \u043e\u0442 \u043a\u0443\u0440\u0441\u0438\u0441\u0442\u0430',
      completed: '\u041f\u0440\u0438\u043a\u043b\u044e\u0447\u0435\u043d',
      active: '\u0410\u043a\u0442\u0438\u0432\u0435\u043d',
      issuedCode: '\u041a\u043e\u0434',
      copyCode: '\u041a\u043e\u043f\u0438\u0440\u0430\u0439',
      closeModal: '\u0417\u0430\u0442\u0432\u043e\u0440\u0438',
      startCodeModalTitle: '\u041a\u043e\u0434 \u0437\u0430 \u0441\u0442\u0430\u0440\u0442 \u043d\u0430 \u0447\u0430\u0441\u0430',
      startCodeModalDescription: '\u041f\u043e\u043a\u0430\u0436\u0435\u0442\u0435 \u043a\u043e\u0434\u0430 \u043d\u0430 \u043a\u0443\u0440\u0441\u0438\u0441\u0442\u0430. \u0422\u043e\u0439 \u0442\u0440\u044f\u0431\u0432\u0430 \u0434\u0430 \u0433\u043e \u0432\u044a\u0432\u0435\u0434\u0435 \u043e\u0442 \u0441\u0432\u043e\u0435\u0442\u043e \u0443\u0441\u0442\u0440\u043e\u0439\u0441\u0442\u0432\u043e.',
      codeCopied: '\u041a\u043e\u0434\u044a\u0442 \u0435 \u043a\u043e\u043f\u0438\u0440\u0430\u043d.',
      copyCodeFailed: '\u041d\u0435 \u0443\u0441\u043f\u044f\u0445\u043c\u0435 \u0434\u0430 \u043a\u043e\u043f\u0438\u0440\u0430\u043c\u0435 \u043a\u043e\u0434\u0430.',
      codeExpires: '\u0432\u0430\u043b\u0438\u0434\u0435\u043d \u0434\u043e',
      issueCodeFailed: '\u041d\u0435 \u0443\u0441\u043f\u044f\u0445\u043c\u0435 \u0434\u0430 \u0438\u0437\u0434\u0430\u0434\u0435\u043c \u0441\u0442\u0430\u0440\u0442\u043e\u0432 \u043a\u043e\u0434.',
      requestEndFailed: '\u041d\u0435 \u0443\u0441\u043f\u044f\u0445\u043c\u0435 \u0434\u0430 \u043c\u0430\u0440\u043a\u0438\u0440\u0430\u043c\u0435 \u0447\u0430\u0441\u0430 \u043a\u0430\u0442\u043e \u043d\u0435\u0443\u0441\u043f\u0435\u0448\u0435\u043d.',
      requestEndSuccess: '\u0427\u0430\u0441\u044a\u0442 \u0435 \u043c\u0430\u0440\u043a\u0438\u0440\u0430\u043d \u043a\u0430\u0442\u043e \u043d\u0435\u0443\u0441\u043f\u0435\u0448\u0435\u043d.',
    }
    : {
      replies: 'Replies',
      cycleStatus: 'Cycle status',
      workflowLoading: 'Loading workflow...',
      workflowLoadFailed: 'Could not load workflow data.',
      sendAgain: 'Send again',
      sending: 'Sending...',
      allocate: 'Allocate slots',
      allocating: 'Allocating...',
      allocationHint: 'Allocation is available only after all active students submit availability.',
      noCycle: 'No sent cycle exists for this week.',
      sendSuccess: 'Schedule has been sent to students.',
      sendFailed: 'Failed to send schedule to students.',
      allocateSuccess: (assigned: number, total: number, unassigned: number) =>
        `Assigned ${assigned}/${total} slots. Unassigned: ${unassigned}.`,
      allocateFailed: 'Could not run allocation.',
      copyPreviousMissing: 'No cycle data found for previous week.',
      copyPreviousDone: 'Copied previous week configuration.',
      copyPreviousFailed: 'Could not copy previous week.',
      lessonsTitle: 'Weekly lessons',
      lessonsEmpty: 'No lessons generated for this week yet.',
      unassigned: 'Unassigned',
      startLesson: 'Start lesson',
      confirmStartTitle: 'Are you sure?',
      confirmStartDescription: 'The lesson start code will be sent to the student immediately.',
      back: 'Back',
      requestEnd: 'Mark failed',
      confirmEndTitle: 'Are you sure?',
      confirmEndDescription: 'This lesson will be marked as unsuccessfully conducted.',
      waitingStudentEnd: 'Waiting for student end confirmation',
      completed: 'Completed',
      active: 'Active',
      issuedCode: 'Code',
      copyCode: 'Copy',
      closeModal: 'Close',
      startCodeModalTitle: 'Lesson Start Code',
      startCodeModalDescription: 'Show this code to the student. They need to enter it from their own device.',
      codeCopied: 'Code copied.',
      copyCodeFailed: 'Could not copy code.',
      codeExpires: 'valid until',
      issueCodeFailed: 'Could not issue lesson start code.',
      requestEndFailed: 'Could not mark lesson as failed.',
      requestEndSuccess: 'Lesson marked as failed.',
    }

  const [weekStartDate] = useState<Date>(() => getStartOfWeek(new Date()))
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true)
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)
  const [isCancellingEdit, setIsCancellingEdit] = useState(false)
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(false)
  const [isLoadingLessons, setIsLoadingLessons] = useState(false)
  const [isSendingToStudents, setIsSendingToStudents] = useState(false)
  const [isAllocating, setIsAllocating] = useState(false)
  const [showSendConfirm, setShowSendConfirm] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [hasPersistedDbSchedule, setHasPersistedDbSchedule] = useState(false)
  const [editSnapshot, setEditSnapshot] = useState('')
  const [workflow, setWorkflow] = useState<InstructorScheduleWorkflow | null>(null)
  const [lessons, setLessons] = useState<LessonListItem[]>([])
  const [confirmStartSlotId, setConfirmStartSlotId] = useState<string | null>(null)
  const [confirmEndSlotId, setConfirmEndSlotId] = useState<string | null>(null)
  const [startCodeModal, setStartCodeModal] = useState<StartCodeModalState | null>(null)
  const [lessonInfoModal, setLessonInfoModal] = useState<LessonInfoModalState | null>(null)
  const [lessonInfoLoading, setLessonInfoLoading] = useState(false)
  const [lessonInfoError, setLessonInfoError] = useState('')
  const [lessonInfoDetails, setLessonInfoDetails] = useState<LessonCandidatesDetails | null>(null)
  const [issuingCodeSlotId, setIssuingCodeSlotId] = useState<string | null>(null)
  const [requestingEndSlotId, setRequestingEndSlotId] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<'planner' | 'active'>(mode)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const [defaultStartTime, setDefaultStartTime] = useState('09:00')
  const [defaultEndTime, setDefaultEndTime] = useState('17:00')
  const [breakPreset, setBreakPreset] = useState<BreakPreset>('normal')
  const [customBreakMinutes, setCustomBreakMinutes] = useState(15)
  const [customLessonSpan, setCustomLessonSpan] = useState(2)
  const [days, setDays] = useState<WeekScheduleDays>(() => getEmptyWeekDays())
  const [lockedDays, setLockedDays] = useState<Record<DayKey, boolean>>(() => getAllDaysLocked())

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
      setActivePanel(mode)
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [mode])

  useEffect(() => {
    if (!saveError) return
    const timeoutId = window.setTimeout(() => {
      pushToast('error', saveError)
      setSaveError('')
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [saveError, pushToast])

  useEffect(() => {
    if (!actionError) return
    const timeoutId = window.setTimeout(() => {
      pushToast('error', actionError)
      setActionError('')
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [actionError, pushToast])

  useEffect(() => {
    if (!actionSuccess) return
    const timeoutId = window.setTimeout(() => {
      pushToast('success', actionSuccess)
      setActionSuccess('')
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [actionSuccess, pushToast])

  const loadWeekData = useCallback(async (
    targetWeek: Date,
    syncDaysFromCycle: boolean,
    options?: { silent?: boolean },
  ) => {
    const isSilent = Boolean(options?.silent)
    if (!isSilent) {
      setIsLoadingWorkflow(true)
      setIsLoadingLessons(true)
    }

    try {
      const weekKey = toIsoDate(targetWeek)
      const [workflowData, lessonRows] = await Promise.all([
        fetchInstructorScheduleWorkflow(weekKey),
        fetchInstructorLessons(weekKey),
      ])

      setWorkflow(workflowData)
      setLessons(lessonRows)

      if (!isEditMode && syncDaysFromCycle) {
        const cycleDays = mapCycleDays(workflowData.cycle)
        if (cycleDays) {
          const derived = deriveGlobalTimesFromDays(cycleDays)
          setDays(cycleDays)
          setDefaultStartTime(derived.startTime)
          setDefaultEndTime(derived.endTime)
        }
      }
    } catch {
      if (!isSilent) {
        setActionError(copy.workflowLoadFailed)
      }
    } finally {
      if (!isSilent) {
        setIsLoadingWorkflow(false)
        setIsLoadingLessons(false)
      }
    }
  }, [copy.workflowLoadFailed, isEditMode])

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      setIsLoadingSchedule(true)
      const loadStart = Date.now()

      try {
        const schedule = await fetchInstructorSchedule()
        const elapsed = Date.now() - loadStart
        const remainingDelay = Math.max(0, MIN_SKELETON_MS - elapsed)
        if (remainingDelay > 0) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, remainingDelay)
          })
        }

        if (!isMounted) return

        if (schedule?.days) {
          const scheduleDays = schedule.days as WeekScheduleDays
          const derived = deriveGlobalTimesFromDays(scheduleDays)
          setDays(scheduleDays)
          setDefaultStartTime(derived.startTime)
          setDefaultEndTime(derived.endTime)
          setEditSnapshot(JSON.stringify(scheduleDays))
          setHasPersistedDbSchedule(true)
        } else {
          const emptyDays = getEmptyWeekDays()
          const derived = deriveGlobalTimesFromDays(emptyDays)
          setDays(emptyDays)
          setDefaultStartTime(derived.startTime)
          setDefaultEndTime(derived.endTime)
          setEditSnapshot(JSON.stringify(emptyDays))
          setHasPersistedDbSchedule(false)
        }
      } catch (error) {
        if (!isMounted) return
        setSaveError(error instanceof Error && error.message ? error.message : t.saveFailed)
      } finally {
        if (isMounted) {
          setIsLoadingSchedule(false)
        }
      }
    }

    void load()

    return () => {
      isMounted = false
    }
  }, [t.saveFailed])

  useEffect(() => {
    if (isEditMode) return
    const timeoutId = window.setTimeout(() => {
      void loadWeekData(weekStartDate, true)
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [isEditMode, loadWeekData, weekStartDate])
  useEffect(() => {
    const socket = getRealtimeSocket()
    const onScheduleChanged = () => {
      if (isEditMode) return
      void loadWeekData(weekStartDate, true, { silent: true })
    }

    socket.on('schedule:changed', onScheduleChanged)
    return () => {
      socket.off('schedule:changed', onScheduleChanged)
    }
  }, [isEditMode, loadWeekData, weekStartDate])

  useEffect(() => {
    if (isEditMode) return
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void loadWeekData(weekStartDate, true, { silent: true })
    }, 7000)

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadWeekData(weekStartDate, true, { silent: true })
      }
    }

    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [isEditMode, loadWeekData, weekStartDate])

  const isDirty = useMemo(
    () => isEditMode && JSON.stringify(days) !== editSnapshot,
    [days, editSnapshot, isEditMode],
  )

  const enabledCount = useMemo(() => DAY_OPTIONS.filter((day) => days[day.key as DayKey].enabled).length, [days])

  const error = useMemo(() => {
    if (enabledCount === 0) return t.errorSelectDay
    const invalidTime = DAY_OPTIONS.some((day) => {
      const dayState = days[day.key as DayKey]
      if (!dayState.enabled) return false
      return toMinutes(dayState.endTime) <= toMinutes(dayState.startTime)
    })
    if (invalidTime) return t.errorDayTimeOrder

    const hasAtLeastOneGenerated = DAY_OPTIONS.some((day) => {
      const dayState = days[day.key as DayKey]
      if (!dayState.enabled) return false
      const desiredBreakMinutes = computeBreakMinutesByPreset(
        dayState.startTime,
        dayState.endTime,
        breakPreset,
        { breakMinutes: customBreakMinutes, lessonSpan: customLessonSpan },
      )
      return generateSlots(dayState.startTime, dayState.endTime, desiredBreakMinutes, breakPreset).length > 0
    })
    if (!hasAtLeastOneGenerated) return t.errorNoSlots
    return ''
  }, [days, breakPreset, enabledCount, customBreakMinutes, customLessonSpan, t.errorDayTimeOrder, t.errorNoSlots, t.errorSelectDay])

  const cycle = workflow?.cycle ?? null
  const expectedReplies = workflow?.expectedReplies ?? 0
  const repliesReceived = workflow?.repliesReceived ?? 0
  const allStudentsReplied = expectedReplies > 0 && repliesReceived >= expectedReplies
  const isAlreadyGenerated = cycle?.status === 'ALLOCATED' || cycle?.status === 'PUBLISHED'

  const canSendToStudents = !isEditMode && hasPersistedDbSchedule && !isAlreadyGenerated
  const canAllocate = !isEditMode && Boolean(cycle?.id) && allStudentsReplied && !isAlreadyGenerated

  function toggleDay(day: DayKey) {
    if (!isEditMode) return
    setDays((current) => ({ ...current, [day]: { ...current[day], enabled: !current[day].enabled } }))
  }

  function updateDayStartTime(day: DayKey, value: string) {
    if (!isEditMode) return
    setDays((current) => ({ ...current, [day]: { ...current[day], startTime: clampTime(value) } }))
  }

  function updateDayEndTime(day: DayKey, value: string) {
    if (!isEditMode) return
    setDays((current) => ({ ...current, [day]: { ...current[day], endTime: clampTime(value) } }))
  }

  function toggleBlockedLesson(day: DayKey, lessonKey: string) {
    if (!isEditMode) return
    setDays((current) => {
      const blocked = current[day].blockedLessonKeys
      const exists = blocked.includes(lessonKey)
      return {
        ...current,
        [day]: {
          ...current[day],
          blockedLessonKeys: exists ? blocked.filter((item) => item !== lessonKey) : [...blocked, lessonKey],
        },
      }
    })
  }

  function unlockDayFromGlobal(day: DayKey) {
    if (!isEditMode) return
    setLockedDays((current) => ({ ...current, [day]: false }))
  }

  function relockDayToGlobal(day: DayKey) {
    if (!isEditMode) return
    setLockedDays((current) => ({ ...current, [day]: true }))
    setDays((current) => ({
      ...current,
      [day]: {
        ...current[day],
        startTime: defaultStartTime,
        endTime: defaultEndTime,
      },
    }))
  }

  const beginCreate = () => {
    setSaveError('')
    setActionError('')
    setActionSuccess('')

    const draft = getDraftWeekDays()
    const derived = deriveGlobalTimesFromDays(draft)
    setDays(draft)
    setDefaultStartTime(derived.startTime)
    setDefaultEndTime(derived.endTime)
    setLockedDays(getAllDaysLocked())
    setEditSnapshot(JSON.stringify(getEmptyWeekDays()))
    setIsEditMode(true)
  }

  const beginEdit = () => {
    setSaveError('')
    setActionError('')
    setActionSuccess('')

    const derived = deriveGlobalTimesFromDays(days)
    setDefaultStartTime(derived.startTime)
    setDefaultEndTime(derived.endTime)
    setLockedDays(getAllDaysLocked())
    setEditSnapshot(JSON.stringify(days))
    setIsEditMode(true)
  }

  const cancelEdit = async () => {
    setSaveError('')
    setActionError('')
    setActionSuccess('')
    setIsCancellingEdit(true)

    try {
      const schedule = await fetchInstructorSchedule()
      if (schedule?.days) {
        const scheduleDays = schedule.days as WeekScheduleDays
        const derived = deriveGlobalTimesFromDays(scheduleDays)
        setDays(scheduleDays)
        setDefaultStartTime(derived.startTime)
        setDefaultEndTime(derived.endTime)
        setEditSnapshot(JSON.stringify(scheduleDays))
        setHasPersistedDbSchedule(true)
      } else {
        const emptyDays = getEmptyWeekDays()
        const derived = deriveGlobalTimesFromDays(emptyDays)
        setDays(emptyDays)
        setDefaultStartTime(derived.startTime)
        setDefaultEndTime(derived.endTime)
        setEditSnapshot(JSON.stringify(emptyDays))
        setHasPersistedDbSchedule(false)
      }

      setLockedDays(getAllDaysLocked())
      setBreakPreset('normal')
      setCustomBreakMinutes(15)
      setCustomLessonSpan(2)
      setShowSendConfirm(false)
      setIsEditMode(false)
      await loadWeekData(weekStartDate, true)
    } catch {
      setSaveError(t.cancelReloadError)
    } finally {
      setIsCancellingEdit(false)
    }
  }

  const handleSave = async () => {
    setSaveError('')
    setActionError('')
    setActionSuccess('')

    if (enabledCount === 0 || error) {
      setSaveError(error || t.saveEnableDay)
      return
    }

    setIsSavingSchedule(true)
    try {
      const schedule = await saveInstructorSchedule({ days: days as InstructorSchedule['days'] })
      if (schedule?.days) {
        const scheduleDays = schedule.days as WeekScheduleDays
        setDays(scheduleDays)
        setEditSnapshot(JSON.stringify(scheduleDays))
        setHasPersistedDbSchedule(true)
      }
      setIsEditMode(false)
    } catch (error) {
      setSaveError(error instanceof Error && error.message ? error.message : t.saveFailed)
    } finally {
      setIsSavingSchedule(false)
    }
  }

  const handleSendToStudents = async () => {
    if (!canSendToStudents) return

    setActionError('')
    setActionSuccess('')
    setIsSendingToStudents(true)

    try {
      const slotBlueprint = buildSlotBlueprint(days, breakPreset, customBreakMinutes, customLessonSpan)
      const workflowData = await sendInstructorScheduleToStudents({
        weekStartDate: toIsoDate(weekStartDate),
        days: days as InstructorSchedule['days'],
        slotBlueprint,
      })

      if (workflowData) {
        setWorkflow(workflowData)
      }

      await loadWeekData(weekStartDate, true)
      setActionSuccess(copy.sendSuccess)
      setShowSendConfirm(false)
    } catch {
      setActionError(copy.sendFailed)
    } finally {
      setIsSendingToStudents(false)
    }
  }

  const handleAllocate = async () => {
    if (!canAllocate || !cycle?.id) return

    setActionError('')
    setActionSuccess('')
    setIsAllocating(true)

    try {
      const result = await allocateInstructorSchedule(cycle.id)
      setActionSuccess(copy.allocateSuccess(result.assignedSlots, result.totalSlots, result.unassignedSlots))
      await loadWeekData(weekStartDate, true)
    } catch {
      setActionError(copy.allocateFailed)
    } finally {
      setIsAllocating(false)
    }
  }

  const handleIssueStartCode = async (slotId: string) => {
    setActionError('')
    setActionSuccess('')
    setConfirmStartSlotId(null)
    setIssuingCodeSlotId(slotId)

    try {
      const response = await issueInstructorLessonStartCode(slotId)
      setStartCodeModal({
        slotId: response.timeSlotId,
        code: response.code,
        expiresAt: response.expiresAt,
      })
      await loadWeekData(weekStartDate, false)
    } catch {
      setActionError(copy.issueCodeFailed)
    } finally {
      setIssuingCodeSlotId(null)
    }
  }

  const handleRequestEnd = async (slotId: string) => {
    setActionError('')
    setActionSuccess('')
    setConfirmEndSlotId(null)
    setRequestingEndSlotId(slotId)

    try {
      await markInstructorLessonFailed(slotId)
      setActionSuccess(copy.requestEndSuccess)
      await loadWeekData(weekStartDate, false)
    } catch {
      setActionError(copy.requestEndFailed)
    } finally {
      setRequestingEndSlotId(null)
    }
  }

  const handleOpenLessonInfo = async (lesson: LessonListItem, timeLabel: string) => {
    if (!lesson.studentId) return
    setLessonInfoModal({ slotId: lesson.id, timeLabel })
    setLessonInfoLoading(true)
    setLessonInfoError('')
    setLessonInfoDetails(null)
    try {
      const details = await fetchInstructorLessonCandidates(lesson.id)
      setLessonInfoDetails(details)
    } catch {
      setLessonInfoError(isBg ? '\u041d\u0435 \u0443\u0441\u043f\u044f\u0445\u043c\u0435 \u0434\u0430 \u0437\u0430\u0440\u0435\u0434\u0438\u043c \u0434\u0430\u043d\u043d\u0438\u0442\u0435 \u0437\u0430 \u0441\u043b\u043e\u0442\u0430.' : 'Could not load slot details.')
    } finally {
      setLessonInfoLoading(false)
    }
  }

  const copyStartCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setActionSuccess(copy.codeCopied)
    } catch {
      setActionError(copy.copyCodeFailed)
    }
  }

  const sortedLessons = useMemo(
    () => [...lessons].sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime)),
    [lessons],
  )

  const resolveLessonDayKey = useCallback((lesson: LessonListItem): DayKey => {
    if (lesson.dayKey && LESSON_DAY_KEYS.includes(lesson.dayKey as DayKey)) {
      return lesson.dayKey as DayKey
    }
    const day = new Date(lesson.startTime).getDay()
    const dayByIndex: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    return dayByIndex[day] || 'monday'
  }, [])

  const lessonsByDay = useMemo(() => {
    const grouped = LESSON_DAY_KEYS.reduce((acc, dayKey) => {
      acc[dayKey] = []
      return acc
    }, {} as Record<DayKey, LessonListItem[]>)

    for (const lesson of sortedLessons) {
      const dayKey = resolveLessonDayKey(lesson)
      grouped[dayKey].push(lesson)
    }

    for (const dayKey of LESSON_DAY_KEYS) {
      grouped[dayKey].sort((a, b) => Date.parse(a.startTime) - Date.parse(b.startTime))
    }

    return grouped
  }, [resolveLessonDayKey, sortedLessons])

  const activeMaxLessonsPerDay = useMemo(
    () => LESSON_DAY_KEYS.reduce((max, dayKey) => Math.max(max, lessonsByDay[dayKey].length), 0),
    [lessonsByDay],
  )
  const activeColumnRows = Math.max(1, activeMaxLessonsPerDay)
  const activeColumnMinHeight = useMemo(
    () => `calc(${activeColumnRows} * 2.25rem + ${Math.max(0, activeColumnRows - 1)} * 0.375rem)`,
    [activeColumnRows],
  )

  const dayDatesByKey = useMemo(
    () =>
      LESSON_DAY_KEYS.reduce((acc, dayKey, index) => {
        acc[dayKey] = addDays(weekStartDate, index)
        return acc
      }, {} as Record<DayKey, Date>),
    [weekStartDate],
  )

  const dayLabels = isBg ? DAY_LABELS_BG : DAY_LABELS_EN
  const locale = isBg ? 'bg-BG' : 'en-US'
  const lessonInfoLabels = isBg
    ? {
      title: '\u0414\u0435\u0442\u0430\u0439\u043b\u0438 \u0437\u0430 \u0441\u043b\u043e\u0442',
      assigned: '\u0417\u0430\u0434\u0430\u0434\u0435\u043d \u043a\u0443\u0440\u0441\u0438\u0441\u0442',
      candidates: '\u0412\u044a\u0437\u043c\u043e\u0436\u043d\u0438 \u0437\u0430\u043c\u0435\u043d\u0438',
      noCandidates: '\u041d\u044f\u043c\u0430 \u043f\u043e\u0434\u0445\u043e\u0434\u044f\u0449\u0438 \u043a\u0430\u043d\u0434\u0438\u0434\u0430\u0442\u0438 \u0437\u0430 \u0437\u0430\u043c\u044f\u043d\u0430.',
      close: '\u0417\u0430\u0442\u0432\u043e\u0440\u0438',
      loading: '\u0417\u0430\u0440\u0435\u0436\u0434\u0430\u043d\u0435...',
      completedHours: '\u0437\u0430\u0432\u044a\u0440\u0448\u0435\u043d\u0438 \u0447\u0430\u0441\u0430',
    }
    : {
      title: 'Slot details',
      assigned: 'Assigned student',
      candidates: 'Possible replacements',
      noCandidates: 'No suitable replacement candidates.',
      close: 'Close',
      loading: 'Loading...',
      completedHours: 'completed hours',
    }
  const legendLabels = isBg
    ? {
      assigned: '\u0421 \u043a\u0443\u0440\u0441\u0438\u0441\u0442',
      unassigned: '\u0411\u0435\u0437 \u043a\u0443\u0440\u0441\u0438\u0441\u0442',
      active: '\u0412 \u0445\u043e\u0434',
      endRequested: '\u041d\u0435\u0443\u0441\u043f\u0435\u0448\u0435\u043d',
      completed: '\u041f\u0440\u0438\u043a\u043b\u044e\u0447\u0435\u043d',
    }
    : {
      assigned: 'Assigned',
      unassigned: 'Unassigned',
      active: 'Active',
      endRequested: 'Failed',
      completed: 'Done',
    }
  return (
    <section className="px-2 pt-2 pb-1 sm:px-3 sm:pt-3 sm:pb-2">
      <div className="rounded-2xl border border-base-content/15 bg-base-100/60 p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
              {activePanel === 'planner' ? (isBg ? '\u0421\u0435\u0434\u043c\u0438\u0447\u0435\u043d \u043f\u043b\u0430\u043d\u0435\u0440 \u043d\u0430 \u0433\u0440\u0430\u0444\u0438\u043a\u0430' : 'Weekly Schedule Planner') : (isBg ? '\u0410\u043a\u0442\u0438\u0432\u043d\u043e \u0441\u0435\u0434\u043c\u0438\u0447\u043d\u043e \u0440\u0430\u0437\u043f\u0438\u0441\u0430\u043d\u0438\u0435' : 'Active Weekly Timetable')}
            </h2>
          </div>
          <div />
        </div>

        <div className="mt-3 grid items-center gap-2 rounded-xl border border-base-content/15 bg-base-100/55 px-3 py-2 md:grid-cols-[1fr_auto_1fr]">
          <div className="text-left">
            {activePanel === 'planner' ? (
              isEditMode ? (
                <p className="text-xs font-semibold text-base-content/65">{isBg ? '\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u0430\u043d\u0435 \u043d\u0430 \u0433\u0440\u0430\u0444\u0438\u043a' : 'Editing schedule'}</p>
              ) : hasPersistedDbSchedule ? (
                <button type="button" className="btn btn-sm btn-outline" onClick={beginEdit}>{t.edit}</button>
              ) : (
                <button type="button" className="btn btn-sm btn-primary" onClick={beginCreate}>{t.createSchedule}</button>
              )
            ) : (
              <>
                <p className="text-xs font-semibold text-base-content/70">{isBg ? '\u041e\u0442\u0433\u043e\u0432\u043e\u0440\u0438 \u0437\u0430 \u043d\u0435\u0434\u043e\u0441\u0442\u044a\u043f\u043d\u043e\u0441\u0442' : copy.replies}</p>
                <p className="inline-flex items-center gap-2 text-xl font-semibold leading-none text-base-content">
                  <span>{repliesReceived}/{expectedReplies}</span>
                  {isLoadingWorkflow ? <Loader2 className="h-5 w-5 animate-spin text-base-content/60" /> : null}
                </p>
              </>
            )}
          </div>
          <div className="inline-flex items-center gap-1.5 sm:gap-2 justify-self-center">
            <span className="min-w-0 text-center text-xl font-semibold text-base-content sm:min-w-72">{formatWeekRange(weekStartDate)}</span>
          </div>
          <div className="flex justify-end">
            <div className="flex flex-wrap items-center gap-2">
              {activePanel === 'planner' ? (
                <>
                  {isEditMode ? (
                    <>
                      <button type="button" className="btn btn-sm btn-ghost" onClick={() => void cancelEdit()} disabled={isSavingSchedule || isCancellingEdit}>
                        {isCancellingEdit ? t.cancelling : t.cancel}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => void handleSave()}
                        disabled={isSavingSchedule || !isDirty || Boolean(error)}
                      >
                        {isSavingSchedule ? t.saving : t.save}
                      </button>
                    </>
                  ) : null}

                  <button
                    type="button"
                    className="btn btn-sm btn-outline"
                    disabled={!canSendToStudents || isSendingToStudents || isEditMode}
                    onClick={() => setShowSendConfirm(true)}
                  >
                    {isSendingToStudents ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />{copy.sending}</>
                    ) : (
                      <><Send className="h-4 w-4" />{isBg ? '\u0418\u0437\u043f\u0440\u0430\u0442\u0438 \u0433\u0440\u0430\u0444\u0438\u043a' : 'Send Schedule'}</>
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  disabled={!canAllocate || isAllocating}
                  onClick={() => void handleAllocate()}
                >
                  {isAllocating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />{copy.allocating}</>
                  ) : (isBg ? '\u0413\u0435\u043d\u0435\u0440\u0438\u0440\u0430\u0439 \u0440\u0430\u0437\u043f\u0438\u0441\u0430\u043d\u0438\u0435' : copy.allocate)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {activePanel === 'planner' ? (
        <>
          {isEditMode && isDirty ? (
            <div className="mt-2">
              <span className="text-xs font-medium text-warning">{t.unsavedChanges}</span>
            </div>
          ) : null}

          {isEditMode ? (
            <div className="mt-2 flex justify-start">
              <ScheduleControls
                language={language}
                startTime={defaultStartTime}
                endTime={defaultEndTime}
                breakPreset={breakPreset}
                customBreakMinutes={customBreakMinutes}
                customLessonSpan={customLessonSpan}
                isEditMode={isEditMode}
                onStartTimeChange={(value) => {
                  const next = clampTime(value)
                  setDefaultStartTime(next)
                  setDays((current) => {
                    const updated = { ...current }
                    DAY_OPTIONS.forEach((day) => {
                      const key = day.key as DayKey
                      if (!lockedDays[key]) return
                      updated[key] = { ...updated[key], startTime: next }
                    })
                    return updated
                  })
                }}
                onEndTimeChange={(value) => {
                  const next = clampTime(value)
                  setDefaultEndTime(next)
                  setDays((current) => {
                    const updated = { ...current }
                    DAY_OPTIONS.forEach((day) => {
                      const key = day.key as DayKey
                      if (!lockedDays[key]) return
                      updated[key] = { ...updated[key], endTime: next }
                    })
                    return updated
                  })
                }}
                onPresetChange={(value) => {
                  if (!isEditMode) return
                  setBreakPreset(value)
                }}
                onCustomBreakMinutesChange={(value) => {
                  if (!isEditMode) return
                  const safe = Number.isFinite(value) ? Math.max(5, Math.min(60, Math.round(value / 5) * 5)) : 15
                  setCustomBreakMinutes(safe)
                }}
                onCustomLessonSpanChange={(value) => {
                  if (!isEditMode) return
                  const safe = Number.isFinite(value) ? Math.max(1, Math.min(8, Math.floor(value))) : 2
                  setCustomLessonSpan(safe)
                }}
              />
            </div>
          ) : null}

          {isLoadingSchedule ? (
            <div className="mt-4 animate-pulse"><ScheduleLoadingSkeleton language={language} /></div>
          ) : hasPersistedDbSchedule || isEditMode ? (
            <WeeklySlots
              language={language}
              weekStartDate={weekStartDate}
              breakPreset={breakPreset}
              customBreakMinutes={customBreakMinutes}
              customLessonSpan={customLessonSpan}
              isEditMode={isEditMode}
              days={days}
              lockedDays={lockedDays}
              onToggleDay={toggleDay}
              onUnlockDayFromGlobal={unlockDayFromGlobal}
              onRelockDayToGlobal={relockDayToGlobal}
              onDayStartTimeChange={updateDayStartTime}
              onDayEndTimeChange={updateDayEndTime}
              onToggleBlockedLesson={toggleBlockedLesson}
            />
          ) : (
            <ScheduleEmptyStatic language={language} />
          )}
        </>
      ) : (
        <div className="mt-2 rounded-xl border border-base-content/15 bg-base-100/60 p-3">
          <div className="rounded-xl border border-base-content/10 bg-base-100/55 px-3 py-2.5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-base-content/65">
                {isBg ? 'Легенда' : 'Legend'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-emerald-500/70 bg-emerald-500/85 px-3 text-xs font-medium text-emerald-950">
                <User className="h-3.5 w-3.5" />
                {legendLabels.assigned}
              </span>
              <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-emerald-900/70 bg-emerald-900/80 px-3 text-xs font-medium text-emerald-100">
                <UserX className="h-3.5 w-3.5" />
                {legendLabels.unassigned}
              </span>
              <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-sky-400/85 bg-sky-400/90 px-3 text-xs font-medium text-sky-950">
                <Pause className="h-3.5 w-3.5" />
                {legendLabels.active}
              </span>
              <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-error/80 bg-error/75 px-3 text-xs font-medium text-error-content">
                <X className="h-3.5 w-3.5" />
                {legendLabels.endRequested}
              </span>
              <span className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-amber-300/85 bg-amber-300 px-3 text-xs font-medium text-amber-950">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {legendLabels.completed}
              </span>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'active' ? (
      <div className="mt-4 rounded-xl border border-base-300/80 bg-base-100/90 p-3 shadow-sm sm:p-4">
        <h3 className="text-base font-semibold text-base-content">{copy.lessonsTitle}</h3>

        {isLoadingLessons ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={`lesson-skeleton-${index}`} className="rounded-xl border border-base-300 bg-base-100 p-3">
                <div className="skeleton h-4 w-2/3 rounded-md" />
                <div className="mt-2 skeleton h-3.5 w-1/2 rounded-md" />
                <div className="mt-3 space-y-2">
                  <div className="skeleton h-8 w-full rounded-md" />
                  <div className="skeleton h-8 w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedLessons.length === 0 ? (
          <p className="mt-2 text-sm text-base-content/70">{copy.lessonsEmpty}</p>
        ) : (
          <div className="mt-3 rounded-xl border border-base-300/70 bg-base-100/80 p-4">
            <h4 className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-base-content/70">{isBg ? '\u0421\u0435\u0434\u043c\u0438\u0446\u0430' : 'Week'}</h4>
            <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-2 xl:grid-cols-7">
              {LESSON_DAY_KEYS.map((dayKey) => {
                const dayLessons = lessonsByDay[dayKey]
                const dayDate = dayDatesByKey[dayKey]
                const dateLabel = dayDate.toLocaleDateString(locale, { day: 'numeric', month: 'short' })

                return (
                  <article key={dayKey} className="min-w-0 rounded-xl border border-base-300 bg-base-100 p-2">
                    <div className="text-center font-semibold leading-tight text-base-content">
                      <p className="text-xs">{dayLabels[dayKey]}</p>
                      <p className="mt-0.5 whitespace-nowrap text-[10px] font-medium text-base-content/60">{dateLabel}</p>
                    </div>

                    <div className="mt-2 space-y-1.5 pr-0.5" style={{ minHeight: activeColumnMinHeight }}>
                      {dayLessons.length === 0 ? (
                        <div className="h-full rounded-xl border border-dashed border-base-300/75 bg-gradient-to-b from-base-100/20 to-base-200/15 px-3 py-6">
                          <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
                            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-base-300/70 bg-base-300/20">
                              <BriefcaseBusiness className="h-5 w-5 text-base-content/60" />
                            </div>
                            <p className="text-lg font-semibold text-base-content/80">
                              {isBg ? '\u041f\u043e\u0447\u0438\u0432\u0435\u043d \u0434\u0435\u043d' : 'Off day'}
                            </p>
                            <p className="mt-1 text-xs text-base-content/55">
                              {isBg ? '\u041d\u044f\u043c\u0430 \u043f\u043b\u0430\u043d' : 'No plan'}
                            </p>
                          </div>
                        </div>
                      ) : dayLessons.map((lesson) => {
                        const start = new Date(lesson.startTime)
                        const timeLabel = start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })

                        const canStart = lesson.studentId && (lesson.state === 'PLANNED' || lesson.state === 'START_CODE_ISSUED')
                        const canRequestEnd = lesson.studentId && lesson.state === 'ACTIVE'
                        const rowTone = lesson.state === 'ACTIVE'
                          ? 'border-sky-400/85 bg-sky-400/90 text-sky-950'
                          : lesson.state === 'FAILED'
                            ? 'border-error/80 bg-error/75 text-error-content'
                          : lesson.state === 'COMPLETED'
                            ? 'border-amber-300/85 bg-amber-300 text-amber-950'
                            : lesson.studentId
                              ? 'border-emerald-500/70 bg-emerald-500/85 text-emerald-950'
                              : 'border-emerald-900/70 bg-emerald-900/80 text-emerald-100'
                        const assigneeLabel = lesson.studentId
                          ? (lesson.studentName?.trim() || lesson.studentUsername || (isBg ? '\u0417\u0430\u0434\u0430\u0434\u0435\u043d \u043a\u0443\u0440\u0441\u0438\u0441\u0442' : 'Assigned student'))
                          : (isBg ? '\u041d\u044f\u043c\u0430 \u0437\u0430\u0434\u0430\u0434\u0435\u043d \u043a\u0443\u0440\u0441\u0438\u0441\u0442' : 'No assigned student')

                        return (
                          <div
                            key={lesson.id}
                            className={`h-[clamp(30px,2.3vw,36px)] w-full rounded-md border px-[clamp(4px,0.4vw,6px)] ${rowTone} ${lesson.studentId ? 'cursor-pointer' : 'cursor-default'}`}
                            onClick={() => void handleOpenLessonInfo(lesson, timeLabel)}
                          >
                            <div className={`grid h-full items-center gap-[clamp(2px,0.24vw,3px)] ${
                              (canStart || canRequestEnd)
                                ? 'grid-cols-[clamp(18px,1.35vw,22px)_minmax(0,1fr)_clamp(18px,1.35vw,22px)]'
                                : 'grid-cols-[clamp(18px,1.35vw,22px)_minmax(0,1fr)_clamp(18px,1.35vw,22px)]'
                            }`}>
                              <span
                                className={`inline-flex h-[clamp(18px,1.35vw,22px)] w-[clamp(18px,1.35vw,22px)] shrink-0 items-center justify-center rounded-md border ${
                                  lesson.state === 'ACTIVE'
                                    ? 'border-sky-700/45 bg-sky-700/20 text-sky-950'
                                    : lesson.state === 'FAILED'
                                      ? 'border-error/45 bg-error/20 text-error-content'
                                    : lesson.state === 'COMPLETED'
                                      ? 'border-amber-700/45 bg-amber-700/20 text-amber-950'
                                      : lesson.studentId
                                        ? 'border-emerald-700/55 bg-emerald-700/25 text-emerald-100'
                                        : 'border-emerald-950/60 bg-emerald-950/30 text-emerald-100'
                                }`}
                                aria-label={assigneeLabel}
                              >
                                {lesson.studentId ? <User className="h-[clamp(9px,0.72vw,11px)] w-[clamp(9px,0.72vw,11px)]" /> : <UserX className="h-[clamp(9px,0.72vw,11px)] w-[clamp(9px,0.72vw,11px)]" />}
                              </span>

                              <span className="min-w-0 overflow-hidden whitespace-nowrap text-center text-[clamp(10px,0.82vw,12px)] font-semibold leading-none tracking-tight tabular-nums">
                                {timeLabel}
                              </span>

                              {canStart ? (
                                <button
                                  type="button"
                                  className="inline-flex h-[clamp(18px,1.35vw,22px)] w-[clamp(18px,1.35vw,22px)] shrink-0 items-center justify-center rounded-full border border-base-content/35 bg-base-100/20 p-0 text-base-content/90 justify-self-end"
                                  aria-label={copy.startLesson}
                                  disabled={issuingCodeSlotId === lesson.id}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setConfirmStartSlotId(lesson.id)
                                  }}
                                >
                                  {issuingCodeSlotId === lesson.id ? <Loader2 className="h-[clamp(9px,0.72vw,11px)] w-[clamp(9px,0.72vw,11px)] animate-spin" /> : <Play className="h-[clamp(9px,0.72vw,11px)] w-[clamp(9px,0.72vw,11px)]" />}
                                </button>
                              ) : canRequestEnd ? (
                                <button
                                  type="button"
                                  className="inline-flex h-[clamp(18px,1.35vw,22px)] w-[clamp(18px,1.35vw,22px)] shrink-0 items-center justify-center rounded-full border border-error/45 bg-error/20 p-0 text-error-content justify-self-end"
                                  aria-label={copy.requestEnd}
                                  disabled={requestingEndSlotId === lesson.id}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setConfirmEndSlotId(lesson.id)
                                  }}
                                >
                                  {requestingEndSlotId === lesson.id ? <Loader2 className="h-[clamp(9px,0.72vw,11px)] w-[clamp(9px,0.72vw,11px)] animate-spin" /> : <X className="h-[clamp(9px,0.72vw,11px)] w-[clamp(9px,0.72vw,11px)]" />}
                                </button>
                              ) : <span className="h-[clamp(18px,1.35vw,22px)] w-[clamp(18px,1.35vw,22px)] justify-self-end" />}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </div>
      ) : null}

      {lessonInfoModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-base-content/20 bg-base-100 p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-base-content">{lessonInfoLabels.title}</p>
                <p className="text-sm text-base-content/70">{lessonInfoModal.timeLabel}</p>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setLessonInfoModal(null)}
              >
                {lessonInfoLabels.close}
              </button>
            </div>

            {lessonInfoLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-base-content/75">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{lessonInfoLabels.loading}</span>
              </div>
            ) : lessonInfoError ? (
              <div className="mt-4 rounded-lg border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
                {lessonInfoError}
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-base-300/75 bg-base-200/40 px-3 py-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/60">{lessonInfoLabels.assigned}</p>
                  <p className="mt-1 text-sm font-semibold text-base-content">
                    {lessonInfoDetails?.assignedStudent
                      ? (lessonInfoDetails.assignedStudent.name?.trim() || lessonInfoDetails.assignedStudent.username || '—')
                      : '—'}
                  </p>
                </div>

                <div className="rounded-lg border border-base-300/75 bg-base-200/30 p-2">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-base-content/60">{lessonInfoLabels.candidates}</p>
                  {lessonInfoDetails?.candidates?.length ? (
                    <div className="max-h-56 space-y-1 overflow-y-auto pr-1">
                      {lessonInfoDetails.candidates.map((candidate) => (
                        <div key={candidate.profileId} className="rounded-md border border-base-300/65 bg-base-100/85 px-2.5 py-1.5">
                          <p className="text-sm font-semibold text-base-content">
                            {candidate.name?.trim() || candidate.username || '—'}
                          </p>
                          {typeof candidate.completedHours === 'number' ? (
                            <p className="text-xs text-base-content/60">
                              {candidate.completedHours} {lessonInfoLabels.completedHours}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-base-content/65">{lessonInfoLabels.noCandidates}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {confirmStartSlotId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-xl border border-base-content/20 bg-base-100 p-4 shadow-xl">
            <p className="text-base font-semibold text-base-content">{copy.confirmStartTitle}</p>
            <p className="mt-1.5 text-sm text-base-content/75">
              {copy.confirmStartDescription}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setConfirmStartSlotId(null)}
              >
                {copy.back}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => void handleIssueStartCode(confirmStartSlotId)}
                disabled={issuingCodeSlotId === confirmStartSlotId}
              >
                {issuingCodeSlotId === confirmStartSlotId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {copy.startLesson}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmEndSlotId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-xl border border-base-content/20 bg-base-100 p-4 shadow-xl">
            <p className="text-base font-semibold text-base-content">{copy.confirmEndTitle}</p>
            <p className="mt-1.5 text-sm text-base-content/75">
              {copy.confirmEndDescription}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setConfirmEndSlotId(null)}
              >
                {copy.back}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => void handleRequestEnd(confirmEndSlotId)}
                disabled={requestingEndSlotId === confirmEndSlotId}
              >
                {requestingEndSlotId === confirmEndSlotId ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {copy.requestEnd}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {startCodeModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-xl border border-base-content/20 bg-base-100 p-4 shadow-xl">
            <p className="text-base font-semibold text-base-content">{copy.startCodeModalTitle}</p>
            <p className="mt-1.5 text-sm text-base-content/75">
              {copy.startCodeModalDescription}
            </p>

            <div className="mt-4 rounded-xl border border-warning/35 bg-warning/10 px-4 py-3 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-warning">{copy.issuedCode}</p>
              <p className="mt-1 font-mono text-3xl font-bold tracking-[0.3em] text-warning">{startCodeModal.code}</p>
              <p className="mt-2 text-xs text-base-content/70">
                {copy.codeExpires} {new Date(startCodeModal.expiresAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setStartCodeModal(null)}
              >
                {copy.closeModal}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => void copyStartCode(startCodeModal.code)}
              >
                {copy.copyCode}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showSendConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-xl border border-base-content/20 bg-base-100 p-4 shadow-xl">
            <p className="text-base font-semibold text-base-content">{t.confirmSendTitle}</p>
            <p className="mt-1.5 text-sm text-base-content/75">
              {t.confirmSendDescription}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setShowSendConfirm(false)}>
                {t.cancel}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => void handleSendToStudents()}
                disabled={isSendingToStudents}
              >
                {isSendingToStudents ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t.ok}
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
