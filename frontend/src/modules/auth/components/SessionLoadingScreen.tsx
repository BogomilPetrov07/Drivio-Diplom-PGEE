import { ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Language } from '../../../i18n/language'
import { getInitialLanguagePreference } from '../../../utils/preferences'

interface SessionLoadingScreenProps {
  language?: Language
  simulateProgress?: boolean
}

const COPY: Record<Language, { title: string; subtitle: string }> = {
  bg: {
    title: 'Зареждане на сесията',
    subtitle: 'Проверяваме сигурно вашия достъп...',
  },
  en: {
    title: 'Loading Session',
    subtitle: 'Securely checking your access...',
  },
}

export default function SessionLoadingScreen({ language, simulateProgress = false }: SessionLoadingScreenProps) {
  const resolvedLanguage = language ?? getInitialLanguagePreference()
  const text = COPY[resolvedLanguage]
  const [progress, setProgress] = useState(12)

  useEffect(() => {
    if (!simulateProgress) return
    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 93) return prev
        const delta = prev < 45 ? 7 : prev < 75 ? 4 : 2
        return Math.min(93, prev + delta)
      })
    }, 180)

    return () => window.clearInterval(timer)
  }, [simulateProgress])

  const progressLabel = useMemo(() => {
    return resolvedLanguage === 'bg' ? `${progress}% заредено` : `${progress}% loaded`
  }, [progress, resolvedLanguage])

  return (
    <main className="min-h-screen flex items-center justify-center bg-base-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-base-300 bg-base-100/90 p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-primary/35 bg-primary/10">
            <span className="absolute h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <ShieldCheck className="relative z-10 h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold text-base-content">{text.title}</p>
            <p className="text-xs text-base-content/70">{text.subtitle}</p>
          </div>
        </div>
        {simulateProgress ? (
          <>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-base-300/70">
              <div
                className="h-full rounded-full bg-primary/80 transition-[width] duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] font-medium text-base-content/65">{progressLabel}</p>
          </>
        ) : null}
      </div>
    </main>
  )
}
