import { CircleHelp, ShieldCheck } from 'lucide-react'
import type { Language } from '../../../i18n/language'
import { useAuth } from '../../auth/hooks'

interface Props {
  language: Language
}

export default function DashboardFaqsPage({ language }: Props) {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'SUPERADMIN'

  return (
    <section className="rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-4 sm:p-5 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)]">
      <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
        {language === 'bg' ? 'Често задавани въпроси' : 'FAQs'}
      </h2>

      <div className="mt-4 rounded-xl border border-base-300 bg-base-100 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-base-content">
          <CircleHelp className="h-4 w-4 text-primary" />
          {language === 'bg' ? 'Информация' : 'Information'}
        </p>
        <p className="mt-2 text-sm text-base-content/75">
          {language === 'bg'
            ? 'Тази страница показва помощната информация, поддържана от супер администраторите.'
            : 'This page shows help content maintained by system super admins.'}
        </p>
      </div>

      {isSuperAdmin ? (
        <div className="mt-3 rounded-xl border border-base-300 bg-base-100 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-base-content">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {language === 'bg' ? 'Администраторски контрол' : 'Admin control'}
          </p>
          <p className="mt-2 text-sm text-base-content/75">
            {language === 'bg'
              ? 'Тук ще бъде достъпно управление на FAQ съдържанието само за супер администратори.'
              : 'FAQ content management will be available here for super admins only.'}
          </p>
        </div>
      ) : null}
    </section>
  )
}

