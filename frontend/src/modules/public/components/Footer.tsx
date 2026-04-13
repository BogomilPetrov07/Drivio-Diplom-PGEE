import { Mail, MapPin, Phone } from 'lucide-react'
import { getPublicTranslations, type Language } from '../../../i18n/public'
import logoDark from '../../../assets/logo_dark.svg'
import logoLight from '../../../assets/logo_light.svg'
import { getDomainAwareUrl } from '../../../utils/app-domain'
import FooterMap from './FooterMap'

interface FooterProps {
  theme: 'drivio-light' | 'drivio-dark'
  language: Language
}

export default function Footer({ theme, language }: FooterProps) {
  const data = getPublicTranslations(language).footer
  const homeHref = getDomainAwareUrl('/')
  const privacyHref = getDomainAwareUrl('/privacy')
  const termsHref = getDomainAwareUrl('/terms')
  const valuePoints =
    language === 'bg'
      ? [
          'Ð•Ð´Ð½Ð° Ð¿Ð»Ð°Ñ‚Ñ„Ð¾Ñ€Ð¼Ð° Ð·Ð° ÐºÑƒÑ€ÑÐ¸ÑÑ‚Ð¸, Ð¸Ð½ÑÑ‚Ñ€ÑƒÐºÑ‚Ð¾Ñ€Ð¸ Ð¸ Ð°Ð´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ‚Ð¾Ñ€Ð¸',
          'ÐŸÐ¾-Ð¼Ð°Ð»ÐºÐ¾ Ñ€ÑŠÑ‡Ð½Ð° Ñ€Ð°Ð±Ð¾Ñ‚Ð° Ñ‡Ñ€ÐµÐ· Ð°Ð²Ñ‚Ð¾Ð¼Ð°Ñ‚Ð¸Ð·Ð¸Ñ€Ð°Ð½Ð¸ Ð¿Ñ€Ð¾Ñ†ÐµÑÐ¸',
          'Ð¯ÑÐ½Ð° Ð¿Ñ€Ð¾ÑÐ»ÐµÐ´Ð¸Ð¼Ð¾ÑÑ‚ Ð½Ð° Ð¿Ñ€Ð¾Ð³Ñ€ÐµÑ, Ð³Ñ€Ð°Ñ„Ð¸Ñ†Ð¸ Ð¸ ÐºÐ¾Ð¼ÑƒÐ½Ð¸ÐºÐ°Ñ†Ð¸Ñ',
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
            <a href={homeHref} className="flex items-center gap-3 mb-4 group">
              <div className="relative">
                <img
                  src={theme === 'drivio-light' ? logoLight : logoDark}
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
                  ? 'Ð¡ÑŠÐ·Ð´Ð°Ð´ÐµÐ½Ð° Ð·Ð° Ð¼Ð¾Ð´ÐµÑ€Ð½Ð¸ Ð°Ð²Ñ‚Ð¾ÑˆÐºÐ¾Ð»Ð¸, ÐºÐ¾Ð¸Ñ‚Ð¾ Ð¸ÑÐºÐ°Ñ‚ Ð¿Ð¾-Ð´Ð¾Ð±Ñ€Ð° Ð¾Ñ€Ð³Ð°Ð½Ð¸Ð·Ð°Ñ†Ð¸Ñ Ð¸ Ð¿Ð¾-Ð²Ð¸ÑÐ¾ÐºÐ¾ ÐºÐ°Ñ‡ÐµÑÑ‚Ð²Ð¾ Ð½Ð° ÑƒÑÐ»ÑƒÐ³Ð°Ñ‚Ð°.'
                  : 'Built for modern driving schools that want better operations and higher service quality.'}
              </p>
              <ul className="space-y-2">
                {valuePoints.map((point, index) => (
                  <li key={index} className="text-helper text-base-content/70 leading-relaxed">
                    â€¢ {point}
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
              <a href={privacyHref} className="text-helper text-base-content/65 hover:opacity-80 transition-opacity duration-150">
                {language === 'bg' ? 'ÐŸÐ¾Ð²ÐµÑ€Ð¸Ñ‚ÐµÐ»Ð½Ð¾ÑÑ‚' : 'Privacy'}
              </a>
              <a href={termsHref} className="text-helper text-base-content/65 hover:opacity-80 transition-opacity duration-150">
                {language === 'bg' ? 'Ð£ÑÐ»Ð¾Ð²Ð¸Ñ' : 'Terms'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

