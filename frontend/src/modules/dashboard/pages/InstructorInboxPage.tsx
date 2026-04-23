import type { Language } from '../../../i18n/language'

interface Props { language: Language }

const BG = {
  title: '\u0412\u0445\u043e\u0434\u044f\u0449\u0438',
  subtitle: '\u0423\u043f\u0440\u0430\u0432\u043b\u044f\u0432\u0430\u0439\u0442\u0435 \u0432\u0445\u043e\u0434\u044f\u0449\u0438\u0442\u0435 \u0441\u044a\u043e\u0431\u0449\u0435\u043d\u0438\u044f \u0438 \u0438\u0437\u0432\u0435\u0441\u0442\u0438\u044f.',
}

export default function InstructorInboxPage({ language }: Props) {
  const isBg = language === 'bg'

  return (
    <section className="rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-5 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)]">
      <h2 className="text-2xl font-semibold tracking-tight text-base-content">{isBg ? BG.title : 'Inbox'}</h2>
      <p className="mt-2 text-sm text-base-content/70">
        {isBg ? BG.subtitle : 'Manage incoming messages and notifications.'}
      </p>
    </section>
  )
}
