import { Globe, MoonStar, SlidersHorizontal } from 'lucide-react'
import type { Language } from '../../../i18n/language'
import { getDashboardTranslations } from '../../../i18n/dashboard'

interface Props {
  language: Language
}

export default function DashboardSettingsPage({ language }: Props) {
  const t = getDashboardTranslations(language).pages.settings

  return (
    <section className="rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-4 sm:p-5 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)]">
      <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">{t.title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-base-300 bg-base-100 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            {t.interfaceTitle}
          </p>
          <p className="mt-1 text-xs text-base-content/65">{t.interfaceHint}</p>
        </article>
        <article className="rounded-xl border border-base-300 bg-base-100 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <Globe className="h-4 w-4 text-primary" />
            {t.languageTitle}
          </p>
          <p className="mt-1 text-xs text-base-content/65">{t.languageHint}</p>
        </article>
        <article className="rounded-xl border border-base-300 bg-base-100 p-4">
          <p className="flex items-center gap-2 text-sm font-medium">
            <MoonStar className="h-4 w-4 text-primary" />
            {t.themeTitle}
          </p>
          <p className="mt-1 text-xs text-base-content/65">{t.themeHint}</p>
        </article>
      </div>
    </section>
  )
}
