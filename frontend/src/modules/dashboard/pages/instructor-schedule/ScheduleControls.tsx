import { ChevronLeft, ChevronRight, Copy, Lock, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { clampTime } from './logic'
import type { BreakPreset } from './types'

interface Props {
  language: 'bg' | 'en'
  startTime: string
  endTime: string
  breakPreset: BreakPreset
  customBreakMinutes: number
  customLessonSpan: number
  isEditMode: boolean
  onStartTimeChange: (value: string) => void
  onEndTimeChange: (value: string) => void
  onPresetChange: (value: BreakPreset) => void
  onCustomBreakMinutesChange: (value: number) => void
  onCustomLessonSpanChange: (value: number) => void
}

export function ScheduleControls({
  language,
  startTime,
  endTime,
  breakPreset,
  customBreakMinutes,
  customLessonSpan,
  isEditMode,
  onStartTimeChange,
  onEndTimeChange,
  onPresetChange,
  onCustomBreakMinutesChange,
  onCustomLessonSpanChange,
}: Props) {
  const isBg = language === 'bg'
  const [startDraft, setStartDraft] = useState('')
  const [endDraft, setEndDraft] = useState('')

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
    <div className="w-full rounded-2xl border border-base-content/20 bg-base-100/65 p-2.5">
      <div className="grid gap-2 lg:grid-cols-[0.21fr_0.43fr_0.36fr] lg:items-stretch">
        <div className="flex h-full flex-col rounded-xl border border-base-content/20 bg-base-100/80 p-2.5 text-xs text-base-content/75">
          <p className="text-sm font-semibold text-base-content">{isBg ? 'Глобално време' : 'Global Time'}</p>
          <div className="mt-4 grid grid-cols-1 gap-4">
            <label className="form-control">
              <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/70">{isBg ? 'Начало' : 'Start'}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
                placeholder={startTime || '09:00'}
                className="input input-sm input-bordered mt-1.5 w-full"
                value={startDraft}
                onChange={(e) => setStartDraft(e.target.value)}
                onBlur={() => {
                  if (!startDraft.trim()) {
                    setStartDraft('')
                    return
                  }
                  const next = toCanonicalTime(startDraft, startTime)
                  setStartDraft(next)
                  onStartTimeChange(next)
                }}
                disabled={!isEditMode}
                aria-label={isBg ? 'Начален час' : 'Start time'}
                title={isBg ? 'Начален час' : 'Start time'}
              />
            </label>

            <div className="h-px bg-base-content/25" aria-hidden="true" />

            <label className="form-control">
              <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/70">{isBg ? 'Край' : 'End'}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="^([01][0-9]|2[0-3]):[0-5][0-9]$"
                placeholder={endTime || '17:00'}
                className="input input-sm input-bordered mt-1.5 w-full"
                value={endDraft}
                onChange={(e) => setEndDraft(e.target.value)}
                onBlur={() => {
                  if (!endDraft.trim()) {
                    setEndDraft('')
                    return
                  }
                  const next = toCanonicalTime(endDraft, endTime)
                  setEndDraft(next)
                  onEndTimeChange(next)
                }}
                disabled={!isEditMode}
                aria-label={isBg ? 'Краен час' : 'End time'}
                title={isBg ? 'Краен час' : 'End time'}
              />
            </label>
          </div>
        </div>

        <div className="h-full rounded-xl border border-base-content/20 bg-base-100/80 p-2.5 text-xs text-base-content/75">
          <p className="text-sm font-semibold text-base-content">{isBg ? 'Почивки' : 'Breaks'}</p>
          <div className="mt-3 flex flex-1 flex-col">
            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="lg:pr-2">
                <p className="mb-2 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-base-content/65">{isBg ? 'Автоматично разпределяне' : 'Auto Dispatch'}</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:[grid-template-columns:repeat(3,minmax(0,1fr))] sm:gap-x-4 sm:gap-y-0 lg:grid lg:grid-cols-1 lg:gap-3">
                  <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                    <input type="radio" name="breakPreset" className="radio radio-sm radio-primary" checked={breakPreset === 'shorter'} onChange={() => onPresetChange('shorter')} disabled={!isEditMode} />
                    <span>{isBg ? 'По-къси' : 'Shorter'}</span>
                  </label>
                  <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                    <input type="radio" name="breakPreset" className="radio radio-sm radio-primary" checked={breakPreset === 'normal'} onChange={() => onPresetChange('normal')} disabled={!isEditMode} />
                    <span>{isBg ? 'Нормални' : 'Normal'}</span>
                  </label>
                  <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                    <input type="radio" name="breakPreset" className="radio radio-sm radio-primary" checked={breakPreset === 'longer'} onChange={() => onPresetChange('longer')} disabled={!isEditMode} />
                    <span>{isBg ? 'По-дълги' : 'Longer'}</span>
                  </label>
                </div>
                <label className="mt-3 flex items-center gap-1 text-sm whitespace-nowrap">
                  <input type="radio" name="breakPreset" className="radio radio-sm radio-primary" checked={breakPreset === 'none'} onChange={() => onPresetChange('none')} disabled={!isEditMode} />
                  <span>{isBg ? 'Без почивки' : 'Without breaks'}</span>
                </label>
              </div>
              <div className="lg:border-l lg:border-base-content/25 lg:pl-4">
                <p className="mb-2 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-base-content/65">{isBg ? 'Персонално разпределяне' : 'Custom Dispatch'}</p>
                <div className="grid grid-cols-1 gap-2">
                  <div className="grid grid-cols-1 gap-2">
                    <label className="flex items-center gap-1 text-sm">
                      <input type="radio" name="breakPreset" className="radio radio-sm radio-primary" checked={breakPreset === 'custom'} onChange={() => onPresetChange('custom')} disabled={!isEditMode} />
                      <span>{isBg ? 'Персонално' : 'Custom'}</span>
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      <label className="form-control">
                        <span className="label-text text-[11px] text-base-content/70">{isBg ? 'Минути почивка' : 'Break minutes'}</span>
                        <input
                          type="number"
                          className="input input-bordered input-sm h-10 w-full text-sm"
                          min={5}
                          max={60}
                          step={5}
                          value={customBreakMinutes}
                          onChange={(e) => onCustomBreakMinutesChange(Number(e.target.value))}
                          disabled={!isEditMode || breakPreset !== 'custom'}
                        />
                      </label>
                      <label className="form-control">
                        <span className="label-text text-[11px] text-base-content/70">{isBg ? 'На всеки N урока' : 'Every N lessons'}</span>
                        <input
                          type="number"
                          className="input input-bordered input-sm h-10 w-full text-sm"
                          min={1}
                          max={8}
                          step={1}
                          value={customLessonSpan}
                          onChange={(e) => onCustomLessonSpanChange(Number(e.target.value))}
                          disabled={!isEditMode || breakPreset !== 'custom'}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="h-full rounded-xl border border-base-content/20 bg-base-100/80 p-2.5 text-xs text-base-content/75">
          <p className="text-sm font-semibold text-base-content">{isBg ? 'Легенда' : 'Legend'}</p>
          <div className="mt-2 grid gap-2.5">
            <section className="rounded-lg border border-base-content/20 bg-base-200/35 p-2.5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-base-content/65">{isBg ? 'Цветове и състояния' : 'Colors and States'}</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 xl:grid-cols-3">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm border border-success/80 bg-success/95" />
                  {isBg ? 'Час за урок' : 'Lesson slot'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm border border-info/80 bg-info/95" />
                  {isBg ? 'Почивка' : 'Break'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-sm border border-error/80 bg-error/75 opacity-90" />
                  {isBg ? 'Блокиран час' : 'Blocked hour'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full border border-success/80 bg-success/20" />
                  {isBg ? 'Активен ден' : 'Enabled day'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded-full border border-base-300 bg-base-200" />
                  {isBg ? 'Неактивен ден' : 'Disabled day'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-4 w-4" strokeWidth={1.75} absoluteStrokeWidth />
                  {isBg ? 'Закл. към глобално' : 'Locked to global'}
                </span>
              </div>
            </section>
            <div className="h-px bg-base-content/25" aria-hidden="true" />
            <section className="rounded-lg border border-base-content/20 bg-base-200/35 p-2.5 text-base-content/75">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-base-content/65">{isBg ? 'Икони' : 'Icons'}</p>
              <div className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2">
                <span className="inline-flex items-center gap-1.5">
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.75} absoluteStrokeWidth />
                  {isBg ? 'Предишна седмица' : 'Previous week'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ChevronRight className="h-4 w-4" strokeWidth={1.75} absoluteStrokeWidth />
                  {isBg ? 'Следваща седмица' : 'Next week'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Copy className="h-4 w-4" strokeWidth={1.75} absoluteStrokeWidth />
                  {isBg ? 'Копирай предишна' : 'Copy previous week'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} absoluteStrokeWidth />
                  {isBg ? 'Редакция на диапазон' : 'Edit day time range'}
                </span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

