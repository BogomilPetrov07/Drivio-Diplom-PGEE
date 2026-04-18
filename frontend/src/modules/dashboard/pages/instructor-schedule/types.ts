export interface TimeSlot {
  start: string
  end: string
}

export interface DayItem {
  id: string
  type: 'lesson' | 'break'
  start: string
  end: string
  gapIndex?: number
}

export type BreakPreset = 'shorter' | 'normal' | 'longer'

export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface DayScheduleConfig {
  enabled: boolean
  startTime: string
  endTime: string
  blockedLessonKeys: string[]
}

export type WeekScheduleDays = Record<DayKey, DayScheduleConfig>

export interface StoredWeekSchedule {
  weekStart: string
  breakPreset: BreakPreset
  defaultStartTime: string
  defaultEndTime: string
  days: WeekScheduleDays
}
