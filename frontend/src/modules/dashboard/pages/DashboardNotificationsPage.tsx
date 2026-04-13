import { BellRing, Smartphone } from 'lucide-react'
import type { Language } from '../../../i18n/language'

interface Props {
  language: Language
}

export default function DashboardNotificationsPage({ language }: Props) {
  return (
    <section className="rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-4 sm:p-5 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)]">
      <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
        {language === 'bg' ? 'Известия' : 'Notifications'}
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-base-300 bg-base-100 p-4">
          <p className="flex items-center gap-2 text-sm font-medium"><BellRing className="h-4 w-4 text-primary" />{language === 'bg' ? 'В приложението' : 'In-app'}</p>
          <p className="mt-1 text-xs text-base-content/65">{language === 'bg' ? 'Управлявайте уведомленията в платформата.' : 'Manage notifications inside the platform.'}</p>
        </article>
        <article className="rounded-xl border border-base-300 bg-base-100 p-4">
          <p className="flex items-center gap-2 text-sm font-medium"><Smartphone className="h-4 w-4 text-primary" />{language === 'bg' ? 'Push към мобилно' : 'Mobile push'}</p>
          <p className="mt-1 text-xs text-base-content/65">{language === 'bg' ? 'Избор на push известия за важни събития.' : 'Choose push alerts for important events.'}</p>
        </article>
      </div>
    </section>
  )
}

