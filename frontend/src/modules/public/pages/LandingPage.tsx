import type { Language } from '../../../i18n/public'
import Features from '../components/Features'
import Footer from '../components/Footer'
import Hero from '../components/Hero'

interface LandingPageProps {
  language: Language
  theme: 'drivio-light' | 'drivio-dark'
}

export default function LandingPage({ language, theme }: LandingPageProps) {
  return (
    <>
      <main>
        <Hero language={language} />
        <Features language={language} />
      </main>
      <Footer theme={theme} language={language} />
    </>
  )
}
