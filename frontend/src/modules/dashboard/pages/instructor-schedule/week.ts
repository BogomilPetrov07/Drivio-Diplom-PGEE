import { DAY_OPTIONS } from './constants'
import type { DayKey, StoredWeekSchedule, WeekScheduleDays } from './types'

const STORAGE_KEY = 'drivio.instructor.week-schedules.v1'

function toIsoDate(value: Date) {
  const y = value.getFullYear()
  const m = `${value.getMonth() + 1}`.padStart(2, '0')
  const d = `${value.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getStartOfWeek(date: Date) {
  const copy = new Date(date)
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function addDays(date: Date, amount: number) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + amount)
  return copy
}

export function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6)
  return `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export function getWeekKey(weekStart: Date) {
  return toIsoDate(weekStart)
}

export function getDateByDayIndex(weekStart: Date, dayIndex: number) {
  return addDays(weekStart, dayIndex)
}

export function getDefaultWeekDays(startTime: string, endTime: string): WeekScheduleDays {
  return {
    monday: { enabled: true, startTime, endTime, blockedLessonKeys: [] },
    tuesday: { enabled: true, startTime, endTime, blockedLessonKeys: [] },
    wednesday: { enabled: true, startTime, endTime, blockedLessonKeys: [] },
    thursday: { enabled: true, startTime, endTime, blockedLessonKeys: [] },
    friday: { enabled: true, startTime, endTime, blockedLessonKeys: [] },
    saturday: { enabled: false, startTime, endTime, blockedLessonKeys: [] },
    sunday: { enabled: false, startTime, endTime, blockedLessonKeys: [] },
  }
}

export function buildDefaultWeek(weekStart: Date): StoredWeekSchedule {
  const defaultStartTime = '09:00'
  const defaultEndTime = '17:00'
  return {
    weekStart: getWeekKey(weekStart),
    breakPreset: 'normal',
    defaultStartTime,
    defaultEndTime,
    days: getDefaultWeekDays(defaultStartTime, defaultEndTime),
  }
}

export function loadWeekStore() {
  if (typeof window === 'undefined') return {} as Record<string, StoredWeekSchedule>
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {} as Record<string, StoredWeekSchedule>
    return JSON.parse(raw) as Record<string, StoredWeekSchedule>
  } catch {
    return {} as Record<string, StoredWeekSchedule>
  }
}

export function saveWeekStore(store: Record<string, StoredWeekSchedule>) {
  if (typeof window === 'undefined') return
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function loadWeekOrPrevious(weekStart: Date) {
  const store = loadWeekStore()
  const weekKey = getWeekKey(weekStart)
  if (store[weekKey]) return store[weekKey]

  const previousWeekKey = getWeekKey(addDays(weekStart, -7))
  if (store[previousWeekKey]) {
    const prev = store[previousWeekKey]
    const copied: StoredWeekSchedule = {
      ...prev,
      weekStart: weekKey,
      days: DAY_OPTIONS.reduce((acc, day) => {
        const key = day.key as DayKey
        acc[key] = {
          ...prev.days[key],
          blockedLessonKeys: [],
        }
        return acc
      }, {} as WeekScheduleDays),
    }
    return copied
  }
  return buildDefaultWeek(weekStart)
}
