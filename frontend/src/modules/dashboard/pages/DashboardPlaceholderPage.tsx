import type { Language } from '../../../i18n/language'

interface Props { language: Language; titleBg: string; titleEn: string; descBg: string; descEn: string }

export default function DashboardPlaceholderPage({ language, titleBg, titleEn, descBg, descEn }: Props) {
  return (
    <section className="rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-3 sm:p-5 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)]">
      <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">{language === 'bg' ? titleBg : titleEn}</h2>
      <p className="mt-2 text-sm text-base-content/70">{language === 'bg' ? descBg : descEn}</p>
    </section>
  )
}
