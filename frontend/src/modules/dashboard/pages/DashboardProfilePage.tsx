import { BadgeCheck, Mail, Shield } from 'lucide-react'
import type { Language } from '../../../i18n/language'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import { useAuth } from '../../auth/hooks'

interface Props {
  language: Language
}

export default function DashboardProfilePage({ language }: Props) {
  const { user } = useAuth()
  const t = getDashboardTranslations(language).pages.profile

  return (
    <section className="rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-4 sm:p-5 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)]">
      <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">{t.title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-base-300 bg-base-100 p-4">
          <p className="text-xs text-base-content/60">{t.username}</p>
          <p className="mt-1 flex items-center gap-2 text-sm font-medium text-base-content">
            <BadgeCheck className="h-4 w-4 text-primary" />
            {user?.username ?? '-'}
          </p>
        </article>
        <article className="rounded-xl border border-base-300 bg-base-100 p-4">
          <p className="text-xs text-base-content/60">{t.role}</p>
          <p className="mt-1 flex items-center gap-2 text-sm font-medium text-base-content">
            <Shield className="h-4 w-4 text-primary" />
            {user?.role ?? '-'}
          </p>
        </article>
      </div>
      <article className="mt-3 rounded-xl border border-base-300 bg-base-100 p-4">
        <p className="text-xs text-base-content/60">{t.contact}</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-base-content/80">
          <Mail className="h-4 w-4 text-primary" />
          {t.contactHint}
        </p>
      </article>
    </section>
  )
}
