import type { Language } from '../../../i18n/public'
import Footer from '../components/Footer'
import ForSchools from '../components/ForSchools'

interface SchoolsPageProps {
  language: Language
  theme: 'drivio-light' | 'drivio-dark'
}

export default function SchoolsPage({ language, theme }: SchoolsPageProps) {
  return (
    <>
      <main>
        <ForSchools language={language} />
      </main>
      <Footer theme={theme} language={language} />
    </>
  )
}
