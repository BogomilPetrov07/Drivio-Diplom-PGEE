import type { Language } from '../../../i18n/language'

interface Props { language: Language }

export default function InstructorSchedulePage({ language }: Props) {
  return (
    <section className="rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-5 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)]">
      <h2 className="text-2xl font-semibold tracking-tight text-base-content">{language === 'bg' ? 'График' : 'Schedule'}</h2>
      <p className="mt-2 text-sm text-base-content/70">{language === 'bg' ? 'Преглеждайте и управлявайте предстоящите уроци.' : 'View and manage upcoming lessons.'}</p>
    </section>
  )
}
