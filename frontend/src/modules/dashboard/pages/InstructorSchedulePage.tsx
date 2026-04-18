import { useEffect, useMemo, useState } from 'react'
import { Ban, ChevronLeft, ChevronRight, Copy } from 'lucide-react'
import type { Language } from '../../../i18n/language'
import { fetchInstructorSchedule, saveInstructorSchedule } from '../api'
import { ScheduleControls } from './instructor-schedule/ScheduleControls'
import { WeeklySlots } from './instructor-schedule/WeeklySlots'
import { clampTime, computeBreakMinutesByPreset, generateSlots, toMinutes } from './instructor-schedule/logic'
import { DAY_OPTIONS } from './instructor-schedule/constants'
import type { BreakPreset, DayKey, WeekScheduleDays } from './instructor-schedule/types'
import { addDays, formatWeekRange, getStartOfWeek } from './instructor-schedule/week'

interface Props { language: Language }

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

function ScheduleLoadingSkeleton({ language }: { language: Language }) {
  const isBg = language === 'bg'

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-base-300 bg-gradient-to-b from-base-100 to-base-200/40 p-4 sm:p-5">
      <div className="rounded-xl border border-base-300/80 bg-base-100/80 p-4">
        <p className="text-sm font-semibold text-base-content">{isBg ? '???? ???????? ??????' : 'No schedule created yet'}</p>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-7">
        {DAY_OPTIONS.map((day) => (
          <article key={day.key} className="rounded-xl border border-base-300/70 bg-base-100 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-base-content/80">{isBg ? day.labelBg : day.labelEn}</p>
              <span className="badge badge-ghost badge-xs">{isBg ? '??????' : 'Empty'}</span>
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

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-base-300 bg-gradient-to-b from-base-100 to-base-200/40 p-4 sm:p-5">
      <div className="rounded-xl border border-base-300/80 bg-base-100/80 p-4">
        <p className="text-sm font-semibold text-base-content">{isBg ? '???? ???????? ??????' : 'No schedule created yet'}</p>
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
                  {isBg ? '???? ??????? ??????' : 'No available schedule'}
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
  const [weekStartDate, setWeekStartDate] = useState<Date>(() => getStartOfWeek(new Date()))
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true)
  const [showAnimatedLoading, setShowAnimatedLoading] = useState(true)
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [hasPersistedDbSchedule, setHasPersistedDbSchedule] = useState(false)
  const [savedDaysSnapshot, setSavedDaysSnapshot] = useState('')

  const [defaultStartTime, setDefaultStartTime] = useState('09:00')
  const [defaultEndTime, setDefaultEndTime] = useState('17:00')
  const [breakPreset, setBreakPreset] = useState<BreakPreset>('normal')
  const [days, setDays] = useState<WeekScheduleDays>(() => getEmptyWeekDays())

  const isCurrentWeek = useMemo(
    () => getStartOfWeek(weekStartDate).getTime() === getStartOfWeek(new Date()).getTime(),
    [weekStartDate],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowAnimatedLoading(false)
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      setIsLoadingSchedule(true)
      const schedule = await fetchInstructorSchedule()
      if (!isMounted) return
      if (schedule?.days) {
        setDays(schedule.days)
        setSavedDaysSnapshot(JSON.stringify(schedule.days))
        setHasPersistedDbSchedule(true)
      } else {
        const emptyDays = getEmptyWeekDays()
        setDays(emptyDays)
        setSavedDaysSnapshot(JSON.stringify(emptyDays))
        setHasPersistedDbSchedule(false)
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
    if (enabledCount === 0) return 'Select at least one day.'
    const invalidTime = DAY_OPTIONS.some((day) => {
      const dayState = days[day.key as DayKey]
      if (!dayState.enabled) return false
      return toMinutes(dayState.endTime) <= toMinutes(dayState.startTime)
    })
    if (invalidTime) return 'Each enabled day must have end time after start time.'

    const hasAtLeastOneGenerated = DAY_OPTIONS.some((day) => {
      const dayState = days[day.key as DayKey]
      if (!dayState.enabled) return false
      const desiredBreakMinutes = computeBreakMinutesByPreset(dayState.startTime, dayState.endTime, breakPreset)
      return generateSlots(dayState.startTime, dayState.endTime, desiredBreakMinutes, breakPreset).length > 0
    })
    if (!hasAtLeastOneGenerated) return 'No valid 1-hour slots can be generated with these settings.'
    return ''
  }, [days, breakPreset, enabledCount])

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

  function copyFromPreviousWeek() {
    if (!isEditMode) return
  }

  const beginCreate = () => {
    setSaveError('')
    setDays(getDraftWeekDays())
    setIsEditMode(true)
  }

  const beginEdit = () => {
    setSaveError('')
    setIsEditMode(true)
  }

  const cancelEdit = () => {
    setSaveError('')
    setIsEditMode(false)
  }

  const handleSave = async () => {
    setSaveError('')
    if (enabledCount === 0 || error) {
      setSaveError(error || 'Enable at least one day before save.')
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
      setSaveError('Save failed. Try again.')
    } finally {
      setIsSavingSchedule(false)
    }
  }

  return (
    <section className="px-2 pt-2 pb-1 sm:px-3 sm:pt-3 sm:pb-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">Weekly Schedule</h2>
        <div className="flex items-center gap-2 rounded-xl bg-base-100/60 p-2">
          {isEditMode ? (
            <>
              {isDirty ? <span className="mr-1 text-xs font-medium text-warning">Unsaved changes</span> : null}
              <button type="button" className="btn btn-sm btn-ghost" onClick={cancelEdit} disabled={isSavingSchedule}>Cancel</button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => void handleSave()}
                disabled={isSavingSchedule || !isDirty || Boolean(error)}
              >
                {isSavingSchedule ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : hasPersistedDbSchedule ? (
            <button type="button" className="btn btn-sm btn-outline" onClick={beginEdit}>Edit</button>
          ) : (
            <button type="button" className="btn btn-sm btn-primary" onClick={beginCreate}>Create Schedule</button>
          )}
        </div>
      </div>

      {isEditMode ? (
        <div className="mt-1.5 flex items-center justify-center">
          <div className="inline-flex items-center gap-3 rounded-xl bg-base-100/55 px-3 py-2">
            <button type="button" className="btn btn-sm btn-circle btn-ghost" onClick={() => setWeekStartDate((d) => addDays(d, -7))} title="Previous week">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-44 text-center text-sm font-semibold text-base-content/80">{formatWeekRange(weekStartDate)}</span>
            {isCurrentWeek ? (
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                onClick={copyFromPreviousWeek}
                title="Copy previous week layout"
                aria-label="Copy previous week layout"
              >
                <Copy className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setWeekStartDate((d) => addDays(d, 7))}
                title="Next week"
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-1 text-center">
          <span className="text-[clamp(1.45rem,2.2vmin,1.8rem)] font-semibold tracking-tight text-base-content/90">
            {formatWeekRange(weekStartDate)}
          </span>
        </div>
      )}

      {isEditMode ? (
        <div className="mt-2 flex justify-start">
          <ScheduleControls
            startTime={defaultStartTime}
            endTime={defaultEndTime}
            breakPreset={breakPreset}
            isEditMode={isEditMode}
            onStartTimeChange={(value) => setDefaultStartTime(clampTime(value))}
            onEndTimeChange={(value) => setDefaultEndTime(clampTime(value))}
            onPresetChange={(value) => {
              if (!isEditMode) return
              setBreakPreset(value)
            }}
          />
        </div>
      ) : null}

      {saveError ? <p className="mt-3 text-sm text-error">{saveError}</p> : null}

      {isLoadingSchedule && showAnimatedLoading ? (
        <div className="mt-4 animate-pulse"><ScheduleLoadingSkeleton language={language} /></div>
      ) : hasPersistedDbSchedule || isEditMode ? (
        <WeeklySlots
          language={language}
          weekStartDate={weekStartDate}
          error={error}
          breakPreset={breakPreset}
          isEditMode={isEditMode}
          days={days}
          onToggleDay={toggleDay}
          onDayStartTimeChange={updateDayStartTime}
          onDayEndTimeChange={updateDayEndTime}
          onToggleBlockedLesson={toggleBlockedLesson}
        />
      ) : (
        <ScheduleEmptyStatic language={language} />
      )}
    </section>
  )
}

