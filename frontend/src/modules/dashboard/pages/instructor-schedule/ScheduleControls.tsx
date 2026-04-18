import { EARLIEST_START, LATEST_END } from './constants'
import type { BreakPreset } from './types'

interface Props {
  startTime: string
  endTime: string
  breakPreset: BreakPreset
  isEditMode: boolean
  onStartTimeChange: (value: string) => void
  onEndTimeChange: (value: string) => void
  onPresetChange: (value: BreakPreset) => void
}

export function ScheduleControls({
  startTime,
  endTime,
  breakPreset,
  isEditMode,
  onStartTimeChange,
  onEndTimeChange,
  onPresetChange,
}: Props) {
  return (
    <div className="w-full rounded-2xl border border-base-300/70 bg-base-100/65 p-3">
      <div className="grid gap-3 lg:grid-cols-3">
        <label className="form-control">
          <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/70">Start</span>
          <input
            type="time"
            className="input input-bordered mt-1 w-full"
            value={startTime}
            onChange={(e) => onStartTimeChange(e.target.value)}
            min={EARLIEST_START}
            max={LATEST_END}
            disabled={!isEditMode}
            aria-label="Start time"
            title="Start time"
          />
        </label>

        <label className="form-control">
          <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/70">End</span>
          <input
            type="time"
            className="input input-bordered mt-1 w-full"
            value={endTime}
            onChange={(e) => onEndTimeChange(e.target.value)}
            min={EARLIEST_START}
            max={LATEST_END}
            disabled={!isEditMode}
            aria-label="End time"
            title="End time"
          />
        </label>

      <div className="form-control">
          <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/70">Breaks</span>
          <div className="mt-1 flex min-h-[2.75rem] items-center justify-center gap-2 rounded-lg border border-base-300/70 bg-base-100/80 px-2 py-1.5">
            <label className="flex items-center gap-1 text-sm">
              <input type="radio" name="breakPreset" className="radio radio-sm radio-primary" checked={breakPreset === 'shorter'} onChange={() => onPresetChange('shorter')} disabled={!isEditMode} />
              <span>Shorter</span>
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input type="radio" name="breakPreset" className="radio radio-sm radio-primary" checked={breakPreset === 'normal'} onChange={() => onPresetChange('normal')} disabled={!isEditMode} />
              <span>Normal</span>
            </label>
            <label className="flex items-center gap-1 text-sm">
              <input type="radio" name="breakPreset" className="radio radio-sm radio-primary" checked={breakPreset === 'longer'} onChange={() => onPresetChange('longer')} disabled={!isEditMode} />
              <span>Longer</span>
            </label>
          </div>
          <span className="mt-1 text-[11px] text-base-content/55">Affects auto-generated break slots.</span>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-base-300/70 bg-base-100/80 p-2.5 text-xs text-base-content/75">
        <p className="text-sm font-semibold text-base-content">Legend</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border border-success/80 bg-success/95" />
            Hour
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border border-info/80 bg-info/95" />
            Break
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border border-base-300 bg-base-200" />
            Disabled day
          </span>
        </div>
      </div>
    </div>
  )
}

