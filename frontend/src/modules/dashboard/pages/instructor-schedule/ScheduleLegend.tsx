import { ChevronLeft, ChevronRight, Copy, Settings2, Circle } from 'lucide-react'

interface Props {
  effectiveBreakMinutes: number
}

export function ScheduleLegend({ effectiveBreakMinutes }: Props) {
  return (
    <div className="rounded-xl border border-base-300/70 bg-base-100/85 p-4 text-xs text-base-content/80">
      <p className="text-sm font-semibold text-base-content">Legend</p>

      <div className="mt-3 grid gap-4 xl:grid-cols-2">
        <section className="space-y-3 rounded-lg bg-base-200/35 p-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border border-success/80 bg-success/95" />
              Hour
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border border-info/80 bg-info/95" />
              Break
            </span>
          </div>
          <div className="text-base-content/65">Auto break: {effectiveBreakMinutes} min</div>
          <div className="h-px bg-base-300/70" />
          <div className="text-base-content/65">Break modes: Shorter, Normal, Longer.</div>
        </section>

        <section className="space-y-2 rounded-lg bg-base-200/35 p-3 text-base-content/70">
          <p className="font-medium text-base-content/80">Controls</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-1"><ChevronLeft className="h-3.5 w-3.5" />Prev</span>
            <span className="inline-flex items-center gap-1"><ChevronRight className="h-3.5 w-3.5" />Next</span>
            <span className="inline-flex items-center gap-1"><Copy className="h-3.5 w-3.5" />Copy</span>
            <span className="inline-flex items-center gap-1"><Settings2 className="h-3.5 w-3.5" />Edit day</span>
            <span className="inline-flex items-center gap-1"><Circle className="h-3.5 w-3.5" />Enable day</span>
          </div>
        </section>
      </div>
    </div>
  )
}
