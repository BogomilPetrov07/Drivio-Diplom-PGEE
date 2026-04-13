import { getDashboardTranslations } from '../../../i18n/dashboard'
import type { Language } from '../../../i18n/language'

interface Props { language: Language; role: 'schoolAdmin' | 'instructor' | 'student' }

export default function RoleHomePage({ language, role }: Props) {
  const dashboardT = getDashboardTranslations(language)
  const t = dashboardT.roles[role]
  const shellCardClass = 'rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)]'

  return (
    <section className={`${shellCardClass} p-5`}>
      <h2 className="text-2xl font-semibold tracking-tight text-base-content">{dashboardT.layout.overview}</h2>
      <p className="mt-1 text-sm text-base-content/70">{t.subtitle}</p>
      <ul className="mt-4 space-y-2 text-sm text-base-content/75">
        {t.items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
    </section>
  )
}
