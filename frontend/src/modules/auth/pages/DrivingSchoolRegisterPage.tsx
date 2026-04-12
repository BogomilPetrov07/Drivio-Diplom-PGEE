import { getAuthTranslations } from '../../../i18n/auth'
import type { Language } from '../../../i18n/language'

interface DrivingSchoolRegisterPageProps {
  language: Language
}

export default function DrivingSchoolRegisterPage({ language }: DrivingSchoolRegisterPageProps) {
  const text = getAuthTranslations(language).register

  return (
    <main className="min-h-screen bg-base-200 px-4 py-24">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-base-300 bg-base-100 p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-base-content">{text.title}</h1>
        <p className="mt-2 text-base-content/70">{text.subtitle}</p>
      </section>
    </main>
  )
}
