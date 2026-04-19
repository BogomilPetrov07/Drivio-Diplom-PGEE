import { CircleHelp, ShieldCheck } from 'lucide-react'
import type { Language } from '../../../i18n/language'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import { useAuth } from '../../auth/hooks'

interface Props {
  language: Language
}

export default function DashboardFaqsPage({ language }: Props) {
  const { user } = useAuth()
  const t = getDashboardTranslations(language).pages.faqs
  const isSuperAdmin = user?.roles?.includes('SUPERADMIN') ?? user?.role === 'SUPERADMIN'

  return (
    <section className="rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-4 sm:p-5 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)]">
      <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">{t.title}</h2>

      <div className="mt-4 rounded-xl border border-base-300 bg-base-100 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-base-content">
          <CircleHelp className="h-4 w-4 text-primary" />
          {t.infoTitle}
        </p>
        <p className="mt-2 text-sm text-base-content/75">{t.infoBody}</p>
      </div>

      {isSuperAdmin ? (
        <div className="mt-3 rounded-xl border border-base-300 bg-base-100 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-base-content">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {t.adminTitle}
          </p>
          <p className="mt-2 text-sm text-base-content/75">{t.adminBody}</p>
        </div>
      ) : null}
    </section>
  )
}
