import { Link } from 'react-router-dom'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import type { Language } from '../../../i18n/language'

interface UnauthorizedPageProps {
  language: Language
}

export default function UnauthorizedPage({ language }: UnauthorizedPageProps) {
  const text = getDashboardTranslations(language).unauthorized

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <section className="max-w-lg rounded-2xl border border-base-300 bg-base-100 p-8 shadow-xl text-center">
        <h1 className="text-3xl font-bold text-base-content">{text.title}</h1>
        <p className="mt-3 text-base-content/70">{text.description}</p>
        <Link className="btn btn-primary mt-6" to="/login">
          {text.back}
        </Link>
      </section>
    </main>
  )
}


