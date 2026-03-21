import { Mail, MapPin, Phone } from 'lucide-react'
import { getPublicTranslations, type Language } from '../../../i18n/public'
import logoDark from '../../../assets/logo_dark.svg'
import logoLight from '../../../assets/logo_light.svg'
import FooterMap from './FooterMap'

interface FooterProps {
  theme: 'drivio-pro-light' | 'drivio-pro-dark'
  language: Language
}

export default function Footer({ theme, language }: FooterProps) {
  const data = getPublicTranslations(language).footer
  const valuePoints =
    language === 'bg'
      ? [
          'Една платформа за курсисти, инструктори и администратори',
          'По-малко ръчна работа чрез автоматизирани процеси',
          'Ясна проследимост на прогрес, графици и комуникация',
        ]
      : [
          'One platform for students, instructors, and admins',
          'Less manual work through automated workflows',
          'Clear visibility into progress, schedules, and communication',
        ]

  return (
    <footer className="bg-base-300 pt-14 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 mb-10 items-stretch">
          <div className="lg:col-span-5 h-full lg:pr-6">
            <a href="/" className="flex items-center gap-3 mb-4 group">
              <div className="relative">
                <img
                  src={theme === 'drivio-pro-light' ? logoLight : logoDark}
                  alt="Drivio Logo"
                  className="h-10 w-auto transition-transform group-hover:scale-105"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight text-primary">Drivio</span>
            </a>

            <p className="text-body text-base-content/70 mb-6 max-w-md">{data.summary}</p>

            <div className="pt-5 mt-5 border-t border-base-content/10 max-w-lg">
              <p className="text-helper text-base-content/65 leading-relaxed mb-4">
                {language === 'bg'
                  ? 'Създадена за модерни автошколи, които искат по-добра организация и по-високо качество на услугата.'
                  : 'Built for modern driving schools that want better operations and higher service quality.'}
              </p>
              <ul className="space-y-2">
                {valuePoints.map((point, index) => (
                  <li key={index} className="text-helper text-base-content/70 leading-relaxed">
                    • {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-7 h-full lg:border-l lg:border-base-content/10 lg:pl-8">
            <div className="bg-base-100/70 border border-base-content/10 rounded-2xl p-5 md:p-6 shadow-sm h-full">
              <div className="grid grid-cols-1 md:grid-cols-8 gap-5 md:gap-6 h-full">
                <div className="h-full flex flex-col md:col-span-3 rounded-xl bg-base-200/40 border border-base-content/8 p-4">
                  <h4 className="text-subheading text-base-content mb-6">{data.headings.contact}</h4>
                  <ul className="space-y-5">
                    <li className="flex items-center gap-3 text-body text-base-content/80 min-h-9">
                      <span className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-primary" />
                      </span>
                      <span className="whitespace-nowrap leading-none">info@drivio.bg</span>
                    </li>
                    <li className="flex items-center gap-3 text-body text-base-content/80 min-h-9">
                      <span className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-secondary" />
                      </span>
                      <span className="whitespace-nowrap leading-none">+359 888 123 456</span>
                    </li>
                    <li className="flex items-center gap-3 text-body text-base-content/80 min-h-9">
                      <span className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-accent" />
                      </span>
                      <span className="whitespace-nowrap leading-none">{data.location}</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-xl overflow-hidden border border-base-content/10 h-full min-h-56 md:min-h-64 md:col-span-5">
                  <FooterMap locationLabel={data.location} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-base-content/10 pt-7">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-helper text-base-content/60">
              &copy; {new Date().getFullYear()} Drivio. {data.copyrightSuffix}
            </p>
            <div className="flex items-center gap-4">
              <a href="/privacy" className="text-helper text-base-content/65 hover:opacity-80 transition-opacity duration-150">
                {language === 'bg' ? 'Поверителност' : 'Privacy'}
              </a>
              <a href="/terms" className="text-helper text-base-content/65 hover:opacity-80 transition-opacity duration-150">
                {language === 'bg' ? 'Условия' : 'Terms'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
