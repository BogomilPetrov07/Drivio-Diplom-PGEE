import { DAY_OPTIONS, EARLIEST_START, LATEST_END, LESSON_MINUTES, MIN_BREAK_MINUTES, SNAP_MINUTES } from './constants'
import type { BreakPreset, DayItem, TimeSlot } from './types'

export interface CustomBreakConfig {
  breakMinutes: number
  lessonSpan: number
}

export function toMinutes(value: string) {
  const [h, m] = value.split(':').map(Number)
  return h * 60 + m
}

export function toTimeString(value: number) {
  const hours = Math.floor(value / 60).toString().padStart(2, '0')
  const minutes = (value % 60).toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

export function clampTime(value: string) {
  const min = toMinutes(EARLIEST_START)
  const max = toMinutes(LATEST_END)
  const current = toMinutes(value)
  if (Number.isNaN(current)) return EARLIEST_START
  if (current < min) return EARLIEST_START
  if (current > max) return LATEST_END
  return value
}

function getFixedNoonBreakByPreset(preset: BreakPreset) {
  if (preset === 'shorter') return 15
  if (preset === 'longer') return 45
  if (preset === 'custom') return MIN_BREAK_MINUTES
  if (preset === 'none') return 0
  return 30
}

function getNoonGapIndex(slotCount: number, dayStartMinutes: number) {
  const gaps = Math.max(slotCount - 1, 0)
  if (gaps === 0) return -1
  const noonStart = 12 * 60
  const noonEnd = 13 * 60
  const noonCenter = 12 * 60 + 30
  let bestIndex = -1
  let bestDistance = Number.POSITIVE_INFINITY

  for (let i = 0; i < gaps; i += 1) {
    const gapStart = dayStartMinutes + (i + 1) * LESSON_MINUTES + i * MIN_BREAK_MINUTES
    if (gapStart >= noonStart && gapStart < noonEnd) {
      const d = Math.abs(gapStart - noonCenter)
      if (d < bestDistance) {
        bestDistance = d
        bestIndex = i
      }
    }
  }
  return bestIndex
}

export function distributeBreaks(
  totalBreakMinutes: number,
  slotCount: number,
  dayStartMinutes = 9 * 60,
  preset: BreakPreset = 'normal',
  custom?: CustomBreakConfig
) {
  const gaps = Math.max(slotCount - 1, 0)
  if (gaps === 0) return [] as number[]

  if (preset === 'custom' && custom) {
    const lessonSpan = Math.max(1, Math.floor(custom.lessonSpan))
    const breakMinutes = Math.max(MIN_BREAK_MINUTES, Math.round(custom.breakMinutes / SNAP_MINUTES) * SNAP_MINUTES)
    const breaks = Array.from({ length: gaps }, () => 0)
    for (let gapIndex = lessonSpan - 1; gapIndex < gaps; gapIndex += lessonSpan) {
      breaks[gapIndex] = breakMinutes
    }
    return breaks
  }

  const roundedTotal = Math.round(totalBreakMinutes / SNAP_MINUTES) * SNAP_MINUTES
  const noonGapIndex = getNoonGapIndex(slotCount, dayStartMinutes)
  const fixedNoon = getFixedNoonBreakByPreset(preset)
  const breaks = Array.from({ length: gaps }, () => 0)
  let remaining = Math.max(0, roundedTotal)

  if (noonGapIndex >= 0) {
    const noonAssigned = Math.min(fixedNoon, remaining)
    breaks[noonGapIndex] = noonAssigned
    remaining -= noonAssigned
  }

  const noon = 12 * 60
  const orderedIndexes = Array.from({ length: gaps }, (_, i) => i)
    .filter((i) => i !== noonGapIndex)
    .sort((a, b) => {
      const aTime = dayStartMinutes + (a + 1) * LESSON_MINUTES + a * MIN_BREAK_MINUTES
      const bTime = dayStartMinutes + (b + 1) * LESSON_MINUTES + b * MIN_BREAK_MINUTES
      // Prefer filling breaks farther from lunch first so we keep only one big lunch break.
      return Math.abs(bTime - noon) - Math.abs(aTime - noon)
    })

  const priority = orderedIndexes
  let pointer = 0
  while (remaining >= SNAP_MINUTES && priority.length > 0) {
    const idx = priority[pointer % priority.length]
    breaks[idx] += SNAP_MINUTES
    remaining -= SNAP_MINUTES
    pointer += 1
  }

  // Keep lunch as the single dominant break around noon.
  if (noonGapIndex >= 0) {
    const noonValue = breaks[noonGapIndex]
    const maxOther = Math.max(0, noonValue - SNAP_MINUTES)
    for (let i = 0; i < breaks.length; i += 1) {
      if (i === noonGapIndex) continue
      if (breaks[i] > maxOther) {
        const overflow = breaks[i] - maxOther
        breaks[i] = maxOther
        breaks[noonGapIndex] += overflow
      }
    }
  }

  for (let i = 0; i < gaps - 1; i += 1) {
    if (breaks[i] === 0 && breaks[i + 1] === 0) {
      const donor = breaks.findIndex((value, index) => index !== i && index !== i + 1 && value >= SNAP_MINUTES * 2)
      if (donor >= 0) {
        breaks[donor] -= SNAP_MINUTES
        breaks[i + 1] += SNAP_MINUTES
      }
    }
  }
  return breaks
}

export function generateSlots(startTime: string, endTime: string, desiredBreakMinutes: number, preset: BreakPreset = 'normal') {
  const start = toMinutes(startTime)
  const end = toMinutes(endTime)
  const totalWindow = end - start
  if (totalWindow < LESSON_MINUTES) return [] as TimeSlot[]

  if (totalWindow <= 120) {
    let shortSlotCount = Math.floor(totalWindow / LESSON_MINUTES)
    const noonStart = 12 * 60
    const noonEnd = 13 * 60
    const overlapsNoon = start < noonEnd && end > noonStart
    if (overlapsNoon) shortSlotCount = 0
    if (shortSlotCount <= 0) return [] as TimeSlot[]

    const shortSlots: TimeSlot[] = []
    let shortCursor = start
    for (let i = 0; i < shortSlotCount; i += 1) {
      const s = shortCursor
      const e = s + LESSON_MINUTES
      shortSlots.push({ start: toTimeString(s), end: toTimeString(e) })
      shortCursor = e
    }
    return shortSlots
  }

  const breakBudget = Math.max(0, Math.min(desiredBreakMinutes, totalWindow - LESSON_MINUTES))
  const slotCount = Math.floor((totalWindow - breakBudget) / LESSON_MINUTES)
  if (slotCount <= 0) return [] as TimeSlot[]

  const exactBreakTotal = Math.max(0, totalWindow - slotCount * LESSON_MINUTES)
  const breaks = distributeBreaks(exactBreakTotal, slotCount, start, preset)
  const slots: TimeSlot[] = []
  let cursor = start

  for (let i = 0; i < slotCount; i += 1) {
    const slotStart = cursor
    const slotEnd = slotStart + LESSON_MINUTES
    if (slotEnd > end) break
    slots.push({ start: toTimeString(slotStart), end: toTimeString(slotEnd) })
    cursor = slotEnd + (breaks[i] ?? 0)
  }
  return slots
}

export function getBreakRatio(preset: BreakPreset) {
  if (preset === 'none') return 0
  if (preset === 'shorter') return 0.1
  if (preset === 'longer') return 0.3
  if (preset === 'custom') return 0
  return 0.2
}

export function computeBreakMinutesByPreset(startTime: string, endTime: string, preset: BreakPreset, custom?: CustomBreakConfig) {
  if (preset === 'none') return 0
  if (preset === 'custom' && custom) {
    const start = toMinutes(startTime)
    const end = toMinutes(endTime)
    const totalWindow = Math.max(0, end - start)
    const lessonSpan = Math.max(1, Math.floor(custom.lessonSpan))
    const breakMinutes = Math.max(MIN_BREAK_MINUTES, Math.round(custom.breakMinutes / SNAP_MINUTES) * SNAP_MINUTES)

    let slotCount = Math.max(0, Math.floor(totalWindow / LESSON_MINUTES))
    for (let i = 0; i < 6; i += 1) {
      const gaps = Math.max(0, slotCount - 1)
      const breakCount = Math.floor(gaps / lessonSpan)
      const breakTotal = breakCount * breakMinutes
      const nextSlotCount = Math.max(0, Math.floor((totalWindow - breakTotal) / LESSON_MINUTES))
      if (nextSlotCount === slotCount) return breakTotal
      slotCount = nextSlotCount
    }

    const gaps = Math.max(0, slotCount - 1)
    const breakCount = Math.floor(gaps / lessonSpan)
    return breakCount * breakMinutes
  }

  const totalWindow = toMinutes(endTime) - toMinutes(startTime)
  const raw = totalWindow * getBreakRatio(preset)
  const rounded = Math.round(raw / SNAP_MINUTES) * SNAP_MINUTES
  return Math.max(MIN_BREAK_MINUTES, rounded)
}

export function buildDayItemsFromBreaks(lessonCount: number, breaks: number[], dayStartMinutes: number) {
  const items: DayItem[] = []
  let cursor = dayStartMinutes
  for (let i = 0; i < lessonCount; i += 1) {
    const lessonStart = cursor
    const lessonEnd = lessonStart + LESSON_MINUTES
    items.push({
      id: `lesson-${i}-${lessonStart}-${lessonEnd}`,
      type: 'lesson',
      start: toTimeString(lessonStart),
      end: toTimeString(lessonEnd),
    })

    if (i < lessonCount - 1) {
      const breakDuration = breaks[i] ?? MIN_BREAK_MINUTES
      const effectiveBreak = breakDuration >= MIN_BREAK_MINUTES ? breakDuration : 0
      const breakStart = lessonEnd
      const breakEnd = breakStart + effectiveBreak
      if (effectiveBreak >= MIN_BREAK_MINUTES) {
        items.push({
          id: `break-${i}-${breakStart}-${breakEnd}`,
          type: 'break',
          start: toTimeString(breakStart),
          end: toTimeString(breakEnd),
          gapIndex: i,
        })
      }
      cursor = breakEnd
    } else {
      cursor = lessonEnd
    }
  }
  return items
}

export function getScheduleError(startTime: string, endTime: string, generatedSlots: TimeSlot[], selectedDaysCount: number) {
  if (toMinutes(startTime) < toMinutes(EARLIEST_START)) return `Start time cannot be earlier than ${EARLIEST_START}.`
  if (toMinutes(endTime) > toMinutes(LATEST_END)) return `End time cannot be later than ${LATEST_END}.`
  if (toMinutes(endTime) <= toMinutes(startTime)) return 'End time must be after start time.'
  if (generatedSlots.length === 0) return 'No valid 1-hour slots can be generated with these settings.'
  if (selectedDaysCount === 0) return 'Select at least one day.'
  return ''
}

export function initBreaksByDay(
  selectedDays: string[],
  breaksByDay: Record<string, number[]>,
  lessonCount: number,
  effectiveBreakMinutes: number,
  viewStartMinutes: number,
  breakPreset: BreakPreset
) {
  const next: Record<string, number[]> = {}
  const gaps = Math.max(lessonCount - 1, 0)
  const defaults = distributeBreaks(effectiveBreakMinutes, lessonCount, viewStartMinutes, breakPreset)

  DAY_OPTIONS.forEach((day) => {
    if (!selectedDays.includes(day.key)) {
      next[day.key] = []
      return
    }
    const existing = breaksByDay[day.key]
    next[day.key] = existing && existing.length === gaps ? existing : defaults
  })
  return next
}
