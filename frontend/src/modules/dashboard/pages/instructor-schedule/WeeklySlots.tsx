import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, CheckCircle2, Lock, SlidersHorizontal } from 'lucide-react'
import type { Language } from '../../../../i18n/language'
import { DAY_OPTIONS, LESSON_MINUTES } from './constants'
import { buildDayItemsFromBreaks, clampTime, computeBreakMinutesByPreset, distributeBreaks, generateSlots, toMinutes } from './logic'
import type { BreakPreset, DayKey, WeekScheduleDays } from './types'

interface Props {
  language: Language
  weekStartDate: Date
  breakPreset: BreakPreset
  customBreakMinutes: number
  customLessonSpan: number
  isEditMode: boolean
  days: WeekScheduleDays
  lockedDays: Record<DayKey, boolean>
  onToggleDay: (day: DayKey) => void
  onUnlockDayFromGlobal: (day: DayKey) => void
  onRelockDayToGlobal: (day: DayKey) => void
  onDayStartTimeChange: (day: DayKey, value: string) => void
  onDayEndTimeChange: (day: DayKey, value: string) => void
  onToggleBlockedLesson: (day: DayKey, lessonKey: string) => void
}

export function WeeklySlots({
  language,
  weekStartDate,
  breakPreset,
  customBreakMinutes,
  customLessonSpan,
  isEditMode,
  days,
  lockedDays,
  onToggleDay,
  onUnlockDayFromGlobal,
  onRelockDayToGlobal,
  onDayStartTimeChange,
  onDayEndTimeChange,
  onToggleBlockedLesson,
}: Props) {
  const isBg = language === 'bg'
  const dateLocale = isBg ? 'bg-BG' : 'en-US'
  const fullDayNames: Record<DayKey, string> = {
    monday: isBg ? 'Понеделник' : 'Monday',
    tuesday: isBg ? 'Вторник' : 'Tuesday',
    wednesday: isBg ? 'Сряда' : 'Wednesday',
    thursday: isBg ? 'Четвъртък' : 'Thursday',
    friday: isBg ? 'Петък' : 'Friday',
    saturday: isBg ? 'Събота' : 'Saturday',
    sunday: isBg ? 'Неделя' : 'Sunday',
  }

  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({})
  const [isCompactViewport, setIsCompactViewport] = useState(false)
  const [editingDay, setEditingDay] = useState<DayKey | null>(null)
  const [startDraft, setStartDraft] = useState('')
  const [endDraft, setEndDraft] = useState('')

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1279px)')
    const update = () => setIsCompactViewport(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  const dayDates = useMemo(
    () =>
      DAY_OPTIONS.reduce((acc, day, index) => {
        const date = new Date(weekStartDate)
        date.setDate(weekStartDate.getDate() + index)
        acc[day.key] = date
        return acc
      }, {} as Record<string, Date>),
    [weekStartDate]
  )

  const dayModels = useMemo(
    () =>
      DAY_OPTIONS.map((day) => {
        const dayKey = day.key as DayKey
        const dayState = days[dayKey]
        const checked = dayState.enabled
        const dateLabel = dayDates[day.key]?.toLocaleDateString(dateLocale, { day: '2-digit', month: 'short' })
        const isCollapsed = isCompactViewport ? (collapsedDays[day.key] ?? false) : false

        const computedBreak = checked
          ? computeBreakMinutesByPreset(
            dayState.startTime,
            dayState.endTime,
            breakPreset,
            { breakMinutes: customBreakMinutes, lessonSpan: customLessonSpan },
          )
          : 0
        const generatedSlots = checked
          ? generateSlots(dayState.startTime, dayState.endTime, computedBreak, breakPreset)
          : []
        const lessonCount = generatedSlots.length
        const totalWindow = checked ? toMinutes(dayState.endTime) - toMinutes(dayState.startTime) : 0
        const effectiveBreak = Math.max(0, totalWindow - lessonCount * LESSON_MINUTES)
        const breaks = checked
          ? distributeBreaks(
            effectiveBreak,
            lessonCount,
            toMinutes(dayState.startTime),
            breakPreset,
            { breakMinutes: customBreakMinutes, lessonSpan: customLessonSpan },
          )
          : []
        const dayItems = checked ? buildDayItemsFromBreaks(lessonCount, breaks, toMinutes(dayState.startTime)) : []

        return {
          day,
          dayKey,
          dayState,
          checked,
          dateLabel,
          isCollapsed,
          dayItems,
        }
      }),
    [days, dayDates, isCompactViewport, collapsedDays, breakPreset, customBreakMinutes, customLessonSpan, dateLocale]
  )

  const defaultExpandedDayKey = useMemo(() => {
    const today = new Date()
    const start = new Date(weekStartDate)
    const end = new Date(weekStartDate)
    end.setDate(end.getDate() + 6)
    const isCurrentWeek = today >= start && today <= end
    if (!isCurrentWeek) return 'monday'

    const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    const match = DAY_OPTIONS.find((day) => {
      const d = dayDates[day.key]
      if (!d) return false
      const normalized = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
      return normalized === normalizedToday
    })
    return match?.key ?? 'monday'
  }, [dayDates, weekStartDate])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setCollapsedDays((prev) => {
        const next: Record<string, boolean> = {}
        DAY_OPTIONS.forEach((day) => {
          if (isCompactViewport) {
            next[day.key] = day.key !== defaultExpandedDayKey
          } else {
            next[day.key] = false
          }
        })

        const unchanged = DAY_OPTIONS.every((day) => prev[day.key] === next[day.key])
        return unchanged ? prev : next
      })
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [isCompactViewport, defaultExpandedDayKey, weekStartDate])

  function toggleCollapsed(dayKey: string) {
    setCollapsedDays((prev) => ({ ...prev, [dayKey]: !prev[dayKey] }))
  }

  const editingDayHasValidTime = editingDay
    ? toMinutes(days[editingDay].endTime) > toMinutes(days[editingDay].startTime)
    : true

  useEffect(() => {
    if (!editingDay) return
    const timeoutId = window.setTimeout(() => {
      setStartDraft('')
      setEndDraft('')
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [editingDay, days])

  const toCanonicalTime = (value: string, fallback: string) => {
    const trimmed = value.trim()
    if (/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) return clampTime(trimmed)

    const digits = trimmed.replace(/\D/g, '')
    if (digits.length === 3 || digits.length === 4) {
      const hourPart = digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2)
      const minutePart = digits.slice(-2)
      const hour = Number(hourPart)
      const minute = Number(minutePart)
      if (Number.isInteger(hour) && Number.isInteger(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return clampTime(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
      }
    }
    return fallback
  }

  return (
    <div className="mt-2 rounded-xl border border-base-300/70 bg-base-100/80 p-4">
      <h3 className="mb-2 text-center text-sm font-semibold uppercase tracking-wide text-base-content/70">{isBg ? 'Седмица' : 'Week'}</h3>
      <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-2 xl:grid-cols-7">
        {dayModels.map(({ day, dayKey, dayState, checked, dateLabel, dayItems, isCollapsed }) => (
          <div key={day.key} className={`min-w-0 rounded-xl border p-2 flex flex-col xl:h-full ${checked ? 'border-base-300 bg-base-100' : 'border-base-300/60 bg-base-200/40'}`}>
              <div className="relative flex items-center justify-center min-h-10 px-7">
                <div className="text-center font-semibold leading-tight text-base-content">
                  <div className="text-xs">
                    <span className="sm:hidden">{language === 'bg' ? day.labelBg : day.labelEn}</span>
                    <span className="hidden sm:inline">{fullDayNames[dayKey]}</span>
                  </div>
                  <div className="mt-0.5 whitespace-nowrap text-[10px] font-medium text-base-content/60">
                    {dateLabel}
                  </div>
                </div>

                {isEditMode ? (
                  <button
                    type="button"
                    className={`absolute left-0 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full border transition-colors ${
                      checked ? 'border-success/80 bg-success/20 text-success' : 'border-base-300 text-base-content/60'
                    }`}
                    style={{ width: '5%', height: '5%', minWidth: '1.15rem', minHeight: '1.15rem', maxWidth: '1.5rem', maxHeight: '1.5rem' }}
                    onClick={() => onToggleDay(dayKey)}
                    aria-label={checked ? `${isBg ? 'Изключи' : 'Disable'} ${fullDayNames[dayKey]}` : `${isBg ? 'Включи' : 'Enable'} ${fullDayNames[dayKey]}`}
                  >
                    <span className={`h-[55%] w-[55%] rounded-full ${checked ? 'bg-success' : 'bg-base-300'}`} />
                  </button>
                ) : null}

                <div className={`absolute top-1/2 -translate-y-1/2 flex items-center ${isEditMode ? 'right-0 gap-0.5' : 'right-0'}`}>
                  {isEditMode ? (
                    lockedDays[dayKey] ? (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center text-base-content/70 transition-colors hover:text-base-content"
                        style={{ width: '1.35rem', height: '1.35rem' }}
                        onClick={() => onUnlockDayFromGlobal(dayKey)}
                        aria-label={`${isBg ? 'Отключи' : 'Unlock'} ${fullDayNames[dayKey]} ${isBg ? 'от глобалните контроли за време' : 'from global time controls'}`}
                        title={isBg ? 'Отключи от глобалните контроли за време' : 'Unlock from global time controls'}
                      >
                        <Lock className="h-4 w-4" strokeWidth={1.75} absoluteStrokeWidth />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center text-base-content/70 transition-colors hover:text-base-content"
                        style={{ width: '1.35rem', height: '1.35rem' }}
                        onClick={() => setEditingDay(dayKey)}
                        aria-label={`${isBg ? 'Настрой работното време за' : 'Adjust'} ${fullDayNames[dayKey]}`}
                        title={isBg ? 'Настрой работно време' : 'Adjust worktime'}
                      >
                        <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} absoluteStrokeWidth />
                      </button>
                    )
                  ) : null}

                  <button
                    type="button"
                    className="btn btn-ghost btn-xs xl:hidden"
                    onClick={() => toggleCollapsed(day.key)}
                    aria-expanded={!isCollapsed}
                    aria-label={`${isCollapsed ? (isBg ? 'Разгъни' : 'Expand') : (isBg ? 'Свий' : 'Collapse')} ${language === 'bg' ? day.labelBg : day.labelEn}`}
                  >
                    {isCollapsed ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 0 1-1.06-.02L10 8.832l-3.71 3.94a.75.75 0 1 1-1.08-1.04l4.25-4.5a.75.75 0 0 1 1.08 0l4.25 4.5a.75.75 0 0 1-.02 1.06Z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {!isEditMode ? (
                <div className="mt-1 text-center text-[10px] text-base-content/60">
                  {checked ? `${dayState.startTime} - ${dayState.endTime}` : (isBg ? 'Няма план' : 'No plan')}
                </div>
              ) : null}

              {!isCollapsed ? (
                <div className="mt-2 xl:flex-1">
                  {checked ? (
                    <div className="space-y-1 pr-0.5">
                      {dayItems.map((slot) => {
                        const lessonKey = `${slot.start}-${slot.end}`
                        const isBlocked = slot.type === 'lesson' && dayState.blockedLessonKeys.includes(lessonKey)
                        return (
                          <button
                            type="button"
                            key={`${day.key}-${slot.id}`}
                            className={
                              slot.type === 'lesson'
                                ? `h-[clamp(24px,3vh,40px)] w-full text-left flex items-center rounded-md border px-2 py-0.5 shadow-sm ${
                                    isBlocked
                                      ? 'border-error/80 bg-error/75 text-error-content opacity-90'
                                      : 'border-success/80 bg-success/95 text-success-content'
                                  }`
                                : 'h-[clamp(24px,3vh,40px)] w-full text-left flex items-center rounded-md border border-info/80 bg-info/95 px-2 py-0.5 shadow-sm text-info-content'
                            }
                            onClick={() => {
                              if (!isEditMode || slot.type !== 'lesson') return
                              onToggleBlockedLesson(dayKey, lessonKey)
                            }}
                            disabled={!isEditMode || slot.type !== 'lesson'}
                          >
                            <div className="w-full truncate whitespace-nowrap text-[10px] leading-tight font-semibold sm:text-[11px]">
                              {slot.start} - {slot.end}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-base-300/80 bg-gradient-to-b from-base-100/30 to-base-200/20 px-3 py-6 xl:h-full">
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
                        <p className="text-base font-semibold text-base-content/80">{isBg ? 'Почивен ден' : 'Day Off'}</p>
                        <p className="mt-1 text-xs text-base-content/55">{isBg ? 'Включете деня от Редакция.' : 'Enable this day in Edit.'}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
          </div>
        ))}
      </div>

      {isEditMode && editingDay ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-xl border border-base-300 bg-base-100 p-4 shadow-2xl">
            <h4 className="text-base font-semibold text-base-content">
              {fullDayNames[editingDay]} {isBg ? 'часове' : 'Time'}
            </h4>
            <p className="mt-1 text-xs text-base-content/60">{isBg ? 'Задайте часовия диапазон за деня.' : 'Set this day window.'}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <label className="form-control">
                <span className="label-text text-xs">{isBg ? 'Начало' : 'Start'}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
                  placeholder={days[editingDay].startTime || '09:00'}
                  className="input input-sm input-bordered w-full"
                  value={startDraft}
                  onChange={(e) => setStartDraft(e.target.value)}
                  onBlur={() => {
                    if (!startDraft.trim()) {
                      setStartDraft('')
                      return
                    }
                    const next = toCanonicalTime(startDraft, days[editingDay].startTime)
                    setStartDraft(next)
                    onDayStartTimeChange(editingDay, next)
                  }}
                />
              </label>
              <label className="form-control">
                <span className="label-text text-xs">{isBg ? 'Край' : 'End'}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
                  placeholder={days[editingDay].endTime || '17:00'}
                  className="input input-sm input-bordered w-full"
                  value={endDraft}
                  onChange={(e) => setEndDraft(e.target.value)}
                  onBlur={() => {
                    if (!endDraft.trim()) {
                      setEndDraft('')
                      return
                    }
                    const next = toCanonicalTime(endDraft, days[editingDay].endTime)
                    setEndDraft(next)
                    onDayEndTimeChange(editingDay, next)
                  }}
                />
              </label>
            </div>
            <span className={`mt-2 inline-flex items-center gap-1 text-xs ${editingDayHasValidTime ? 'text-success' : 'text-error'}`}>
              {editingDayHasValidTime ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
              {editingDayHasValidTime ? (isBg ? 'Часовият диапазон е валиден' : 'Time range looks good') : (isBg ? 'Крайният час трябва да е след началния' : 'End time must be after start time')}
            </span>
            <div className="mt-4 flex justify-end gap-2">
              {!lockedDays[editingDay] ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    onRelockDayToGlobal(editingDay)
                    setEditingDay(null)
                  }}
                >
                  {isBg ? 'Назад към глобалните настройки' : 'Back to global'}
                </button>
              ) : null}
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => setEditingDay(null)}>
                {isBg ? 'Отказ' : 'Cancel'}
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => {
                  if (!editingDayHasValidTime) return
                  setEditingDay(null)
                }}
                disabled={!editingDayHasValidTime}
              >
                {isBg ? 'Запази' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
