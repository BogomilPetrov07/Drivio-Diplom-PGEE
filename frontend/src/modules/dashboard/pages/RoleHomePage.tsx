import { getDashboardTranslations } from '../../../i18n/dashboard'
import type { Language } from '../../../i18n/language'
import { Link, useLocation } from 'react-router-dom'

interface Props { language: Language; role: 'schoolAdmin' | 'instructor' | 'student' }

export default function RoleHomePage({ language, role }: Props) {
  const isBg = language === 'bg'
  const dashboardT = getDashboardTranslations(language)
  const t = dashboardT.roles[role]
  const location = useLocation()
  const shellCardClass = 'rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)]'
  const schedulePlannerPath =
    location.pathname.startsWith('/dashboard/schooladmin/instructor/')
      ? '/dashboard/schooladmin/instructor/planner'
      : '/dashboard/instructor/planner'

  return (
    <section className={`${shellCardClass} p-5`}>
      <h2 className="text-2xl font-semibold tracking-tight text-base-content">{dashboardT.layout.overview}</h2>
      <p className="mt-1 text-sm text-base-content/70">{t.subtitle}</p>
      <ul className="mt-4 space-y-2 text-sm text-base-content/75">
        {t.items.map((item) => (
          <li key={item}>- {item}</li>
        ))}
      </ul>
      {role === 'instructor' ? (
        <div className="mt-5 rounded-xl border border-base-content/15 bg-base-100/60 p-4">
          <p className="text-base font-semibold text-base-content">{isBg ? 'Активен график за текущата седмица' : 'Current Week Active Schedule'}</p>
          <p className="mt-1 text-sm text-base-content/70">
            {isBg
              ? 'Това е оперативният изглед за текущата учебна седмица. Планирането се прави в Планера на графика.'
              : 'This is the execution view for the current teaching week. Planning stays in Schedule Planner.'}
          </p>
          <div className="mt-3">
            <Link to={schedulePlannerPath} className="btn btn-sm btn-outline">
              {isBg ? 'Отвори планера на графика' : 'Open Schedule Planner'}
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  )
}
