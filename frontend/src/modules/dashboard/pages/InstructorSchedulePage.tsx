import { useEffect, useMemo, useState } from 'react'
import { Ban, ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import type { Language } from '../../../i18n/language'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import { fetchInstructorSchedule, saveInstructorSchedule } from '../api'
import { ScheduleControls } from './instructor-schedule/ScheduleControls'
import { WeeklySlots } from './instructor-schedule/WeeklySlots'
import { clampTime, computeBreakMinutesByPreset, generateSlots, toMinutes } from './instructor-schedule/logic'
import { DAY_OPTIONS } from './instructor-schedule/constants'
import type { BreakPreset, DayKey, WeekScheduleDays } from './instructor-schedule/types'
import { addDays, formatWeekRange, getStartOfWeek } from './instructor-schedule/week'

interface Props { language: Language }
const MIN_SKELETON_MS = 2000

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

export default function InstructorSchedulePage({ language }: Props) {
  const t = getDashboardTranslations(language).pages.instructorSchedule
  const MAX_INSTRUCTOR_STUDENTS = 12
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => getStartOfWeek(new Date()))
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true)
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)
  const [isCancellingEdit, setIsCancellingEdit] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [hasPersistedDbSchedule, setHasPersistedDbSchedule] = useState(false)
  const [savedDaysSnapshot, setSavedDaysSnapshot] = useState('')

  const [defaultStartTime, setDefaultStartTime] = useState('09:00')
  const [defaultEndTime, setDefaultEndTime] = useState('17:00')
  const [breakPreset, setBreakPreset] = useState<BreakPreset>('normal')
  const [customBreakMinutes, setCustomBreakMinutes] = useState(15)
  const [customLessonSpan, setCustomLessonSpan] = useState(2)
  const [days, setDays] = useState<WeekScheduleDays>(() => getEmptyWeekDays())
  const [lockedDays, setLockedDays] = useState<Record<DayKey, boolean>>(() => getAllDaysLocked())
  const [blackoutRepliesCount] = useState(0)
  const [hasSentToStudents, setHasSentToStudents] = useState(false)
  const [showSendConfirm, setShowSendConfirm] = useState(false)

  const isCurrentWeek = useMemo(
    () => getStartOfWeek(weekStartDate).getTime() === getStartOfWeek(new Date()).getTime(),
    [weekStartDate],
  )
  const allStudentsReplied = blackoutRepliesCount >= MAX_INSTRUCTOR_STUDENTS
  const canGenerateActiveSchedule = allStudentsReplied && !isEditMode
  const canSendToStudents = !allStudentsReplied && !hasSentToStudents && !isEditMode && hasPersistedDbSchedule

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setIsLoadingSchedule(true)
      const loadStart = Date.now()
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
        const derived = deriveGlobalTimesFromDays(schedule.days)
        setDays(schedule.days)
        setDefaultStartTime(derived.startTime)
        setDefaultEndTime(derived.endTime)
        setSavedDaysSnapshot(JSON.stringify(schedule.days))
        setHasPersistedDbSchedule(true)
        setLockedDays(getAllDaysLocked())
      } else {
        const emptyDays = getEmptyWeekDays()
        const derived = deriveGlobalTimesFromDays(emptyDays)
        setDays(emptyDays)
        setDefaultStartTime(derived.startTime)
        setDefaultEndTime(derived.endTime)
        setSavedDaysSnapshot(JSON.stringify(emptyDays))
        setHasPersistedDbSchedule(false)
        setLockedDays(getAllDaysLocked())
      }
      setIsLoadingSchedule(false)
    }
    void load()
    return () => {
      isMounted = false
    }
  }, [])

  const isDirty = useMemo(() => JSON.stringify(days) !== savedDaysSnapshot, [days, savedDaysSnapshot])

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

  function copyFromPreviousWeek() {
    if (!isEditMode) return
  }

  const beginCreate = () => {
    setSaveError('')
    const draft = getDraftWeekDays()
    const derived = deriveGlobalTimesFromDays(draft)
    setDays(draft)
    setDefaultStartTime(derived.startTime)
    setDefaultEndTime(derived.endTime)
    setLockedDays(getAllDaysLocked())
    setHasSentToStudents(false)
    setIsEditMode(true)
  }

  const beginEdit = () => {
    setSaveError('')
    const derived = deriveGlobalTimesFromDays(days)
    setDefaultStartTime(derived.startTime)
    setDefaultEndTime(derived.endTime)
    setLockedDays(getAllDaysLocked())
    setHasSentToStudents(false)
    setIsEditMode(true)
  }

  const cancelEdit = async () => {
    setSaveError('')
    setIsCancellingEdit(true)
    try {
      const schedule = await fetchInstructorSchedule()
      if (schedule?.days) {
        const derived = deriveGlobalTimesFromDays(schedule.days)
        setDays(schedule.days)
        setDefaultStartTime(derived.startTime)
        setDefaultEndTime(derived.endTime)
        setSavedDaysSnapshot(JSON.stringify(schedule.days))
        setHasPersistedDbSchedule(true)
      } else {
        const emptyDays = getEmptyWeekDays()
        const derived = deriveGlobalTimesFromDays(emptyDays)
        setDays(emptyDays)
        setDefaultStartTime(derived.startTime)
        setDefaultEndTime(derived.endTime)
        setSavedDaysSnapshot(JSON.stringify(emptyDays))
        setHasPersistedDbSchedule(false)
      }
      setLockedDays(getAllDaysLocked())
      setBreakPreset('normal')
      setCustomBreakMinutes(15)
      setCustomLessonSpan(2)
      setHasSentToStudents(false)
      setShowSendConfirm(false)
      setIsEditMode(false)
    } catch {
      setSaveError(t.cancelReloadError)
    } finally {
      setIsCancellingEdit(false)
    }
  }

  const handleSave = async () => {
    setSaveError('')
    if (enabledCount === 0 || error) {
      setSaveError(error || t.saveEnableDay)
      return
    }

    setIsSavingSchedule(true)
    try {
      const schedule = await saveInstructorSchedule({ days })
      if (schedule?.days) {
        setDays(schedule.days)
        setSavedDaysSnapshot(JSON.stringify(schedule.days))
        setHasPersistedDbSchedule(true)
      }
      setIsEditMode(false)
    } catch {
      setSaveError(t.saveFailed)
    } finally {
      setIsSavingSchedule(false)
    }
  }

  return (
    <section className="px-2 pt-2 pb-1 sm:px-3 sm:pt-3 sm:pb-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">{t.title}</h2>
        <div className="flex items-center gap-2 rounded-xl bg-base-100/60 p-2">
          {isEditMode ? (
            <>
              {isDirty ? <span className="mr-1 text-xs font-medium text-warning">{t.unsavedChanges}</span> : null}
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
          ) : hasPersistedDbSchedule ? (
            <button type="button" className="btn btn-sm btn-outline" onClick={beginEdit}>{t.edit}</button>
          ) : (
            <button type="button" className="btn btn-sm btn-primary" onClick={beginCreate}>{t.createSchedule}</button>
          )}
        </div>
      </div>

      <div className={`mt-1.5 grid items-center gap-2 rounded-xl border border-base-content/15 bg-base-100/55 px-3 py-2 ${isEditMode ? 'md:grid-cols-1' : 'md:grid-cols-[1fr_auto_1fr]'}`}>
        {!isEditMode ? (
          <div className="text-center md:text-left">
            <p className="text-[11px] font-semibold text-base-content/70">{t.blackoutReplies}</p>
            <p className="text-sm font-semibold text-base-content">
              {blackoutRepliesCount}/{MAX_INSTRUCTOR_STUDENTS}
            </p>
          </div>
        ) : null}

        {isEditMode ? (
          <div className="inline-flex items-center gap-3 justify-self-center rounded-xl bg-base-100/55 px-3 py-2">
            <button type="button" className="btn btn-sm btn-circle btn-ghost" onClick={() => setWeekStartDate((d) => addDays(d, -7))} title={t.previousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-44 text-center text-sm font-semibold text-base-content/80">{formatWeekRange(weekStartDate)}</span>
            {isCurrentWeek ? (
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                onClick={copyFromPreviousWeek}
                title={t.copyPreviousWeek}
                aria-label={t.copyPreviousWeek}
              >
                <Copy className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setWeekStartDate((d) => addDays(d, 7))}
                title={t.nextWeek}
                aria-label={t.nextWeek}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="justify-self-center text-center">
            <span className="text-[clamp(1.15rem,1.7vmin,1.35rem)] font-semibold tracking-tight text-base-content/90">
              {formatWeekRange(weekStartDate)}
            </span>
          </div>
        )}

        {!isEditMode ? (
          <div className="justify-self-center md:justify-self-end">
            <button
              type="button"
              className={`btn btn-sm ${canGenerateActiveSchedule ? 'btn-primary' : 'btn-outline'}`}
              disabled={!(canGenerateActiveSchedule || canSendToStudents)}
              onClick={() => {
                if (canGenerateActiveSchedule) return
                setShowSendConfirm(true)
              }}
            >
              {canGenerateActiveSchedule ? t.generateActive : hasSentToStudents ? t.sentToStudents : t.sendToStudents}
            </button>
          </div>
        ) : null}
      </div>

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

      {saveError ? <p className="mt-3 text-sm text-error">{saveError}</p> : null}

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
                onClick={() => {
                  setHasSentToStudents(true)
                  setShowSendConfirm(false)
                }}
              >
                {t.ok}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
