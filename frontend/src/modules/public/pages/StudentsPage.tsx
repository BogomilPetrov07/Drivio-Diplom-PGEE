import type { Language } from '../../../i18n/public'
import Footer from '../components/Footer'
import ForStudents from '../components/ForStudents'

interface StudentsPageProps {
  language: Language
  theme: 'drivio-pro-light' | 'drivio-pro-dark'
}

export default function StudentsPage({ language, theme }: StudentsPageProps) {
  return (
    <>
      <main>
        <ForStudents language={language} />
      </main>
      <Footer theme={theme} language={language} />
    </>
  )
}
