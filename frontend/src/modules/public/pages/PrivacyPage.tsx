import { useEffect, useMemo, useState } from 'react'

import type { Language } from '../../../i18n/public'
import { getDomainAwareUrl } from '../../../utils/app-domain'
import Footer from '../components/Footer'

interface PrivacyPageProps {
  language: Language
  theme: 'drivio-light' | 'drivio-dark'
}

type Section = {
  id: string
  title: string
  content: string[]
}

export default function PrivacyPage({ language, theme }: PrivacyPageProps) {
  const isBg = language === 'bg'
  const [activeId, setActiveId] = useState('data-collected')
  const homeHref = getDomainAwareUrl('/')

  const sections = useMemo<Section[]>(
    () => [
      {
        id: 'data-collected',
        title: isBg ? '1.0 Какви данни събираме' : '1.0 Data We Collect',
        content: isBg
          ? [
              'Събираме данни, необходими за работата на Drivio: име, имейл, телефон, профилни данни, роли, обучителен прогрес, графици и комуникации.',
              'Автоматично обработваме технически данни като IP адрес, тип устройство, браузър, логове за сигурност и диагностична информация.',
            ]
          : [
              'We collect data required to operate Drivio: name, email, phone, profile details, role assignments, training progress, schedules, and communications.',
              'We automatically process technical data such as IP address, device type, browser, security logs, and diagnostic information.',
            ],
      },
      {
        id: 'data-use',
        title: isBg ? '2.0 Как използваме данните' : '2.0 How We Use Data',
        content: isBg
          ? [
              'Използваме данните за предоставяне на услугата, управление на профили, синхронизация на графици и изпращане на важни продуктови известия.',
              'Данните се използват и за подобрение на продукта, предотвратяване на злоупотреби, поддръжка и спазване на законови изисквания.',
            ]
          : [
              'We use data to provide the service, manage accounts, synchronize schedules, and deliver critical product notifications.',
              'Data is also used to improve the product, prevent abuse, provide support, and meet legal obligations.',
            ],
      },
      {
        id: 'sharing',
        title: isBg ? '3.0 Споделяне и обработващи' : '3.0 Sharing and Processors',
        content: isBg
          ? [
              'Не продаваме лични данни. Споделяме данни само с доверени доставчици (хостинг, анализи, имейл) при договорни гаранции за поверителност и сигурност.',
              'Разкриваме данни на компетентни органи само когато това се изисква по закон.',
            ]
          : [
              'We do not sell personal data. We share data only with trusted service providers (hosting, analytics, email) under contractual privacy and security safeguards.',
              'We disclose data to competent authorities only when required by law.',
            ],
      },
      {
        id: 'cookies',
        title: isBg ? '4.0 Бисквитки и сходни технологии' : '4.0 Cookies and Similar Technologies',
        content: isBg
          ? ['Използваме бисквитки за вход и сигурност, запазване на предпочитания и подобряване на потребителското изживяване.']
          : ['We use cookies for authentication, security, language preferences, and improving the user experience.'],
      },
      {
        id: 'rights',
        title: isBg ? '5.0 Вашите права (GDPR/CCPA)' : '5.0 Your Rights (GDPR/CCPA)',
        content: isBg
          ? [
              'Имате право на достъп, корекция, ограничаване, възражение и преносимост на данните, когато е приложимо.',
              'Имате право да поискате изтриване на лични данни. При валидно искане изтриваме данните без неоправдано забавяне, освен ако законът изисква съхранение.',
            ]
          : [
              'You may request access, correction, restriction, objection, and portability of your data where applicable.',
              'You have the right to request deletion of personal data. Upon a valid request, we delete data without undue delay unless legal retention is required.',
            ],
      },
      {
        id: 'retention-security',
        title: isBg ? '6.0 Съхранение и сигурност' : '6.0 Retention and Security',
        content: isBg
          ? [
              'Данните се съхраняват само за периода, необходим за предоставяне на услугата и изпълнение на законови задължения.',
              'Прилагаме технически и организационни мерки за сигурност, включително контрол на достъп, логване и мониторинг на инциденти.',
            ]
          : [
              'Data is retained only for the period necessary to provide the service and satisfy legal obligations.',
              'We implement technical and organizational safeguards, including access control, logging, and incident monitoring.',
            ],
      },
      {
        id: 'contact',
        title: isBg ? '7.0 Свържете се с нас' : '7.0 Contact Us',
        content: isBg
          ? ['За въпроси относно поверителността, права по GDPR или искане за изтриване: info@drivio.bg']
          : ['For privacy inquiries, data subject rights, or deletion requests: info@drivio.bg'],
      },
    ],
    [isBg],
  )

  useEffect(() => {
    const updateActiveSection = () => {
      const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24
      if (nearBottom) {
        setActiveId(sections[sections.length - 1]?.id ?? 'contact')
        return
      }

      const headerOffset = 160
      const pageMarker = window.scrollY + headerOffset
      let nextActiveId = sections[0]?.id ?? 'data-collected'

      for (const section of sections) {
        const el = document.getElementById(section.id)
        if (!el) continue
        if (el.offsetTop <= pageMarker) {
          nextActiveId = section.id
        } else {
          break
        }
      }

      setActiveId(nextActiveId)
    }

    updateActiveSection()
    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)

    return () => {
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
    }
  }, [sections])

  return (
    <>
      <main className="min-h-screen bg-base-100 pb-14 pt-24 font-['Inter',sans-serif] text-base-content">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr]">
            <nav className="sticky top-28 hidden self-start lg:block" aria-label={isBg ? 'Съдържание' : 'Table of contents'}>
              <p className="mb-3 text-sm text-base-content">{isBg ? 'Съдържание' : 'Contents'}</p>
              <ul className="space-y-2 text-sm">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      onClick={() => setActiveId(section.id)}
                      className={`block rounded-md px-3 py-2 transition-colors ${
                        activeId === section.id ? 'bg-base-content/10 text-base-content' : 'text-base-content/75 hover:bg-base-content/5'
                      }`}
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <article className="w-full max-w-[800px]">
              <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-base-content md:text-4xl">{isBg ? 'Политика за поверителност' : 'Privacy Policy'}</h1>
                </div>
                <div className="flex items-center gap-2">
                  <span className="min-w-[220px] whitespace-nowrap rounded-md border border-base-content/20 px-3 py-1 text-center text-xs text-base-content/85">
                    {isBg ? 'Актуализирано: 21.03.2026' : 'Last Updated: 2026-03-21'}
                  </span>
                </div>
              </header>

              <section className="mb-7 rounded-xl border border-base-content/15 bg-base-200/30 p-5">
                <h2 className="mb-3 text-base font-semibold text-base-content">{isBg ? 'Кратко обобщение' : 'Quick Summary'}</h2>
                <ul className="space-y-2 text-sm text-base-content/90">
                  <li>{isBg ? 'Събираме само данните, нужни за работата на услугата.' : 'We collect only the data needed to run the service.'}</li>
                  <li>{isBg ? 'Не продаваме лични данни на трети страни.' : 'We do not sell personal data to third parties.'}</li>
                  <li>{isBg ? 'Можете да поискате достъп, корекция или изтриване на вашите данни.' : 'You can request access, correction, or deletion of your data.'}</li>
                  <li>{isBg ? 'Прилагаме технически и организационни мерки за защита.' : 'We apply technical and organizational security safeguards.'}</li>
                </ul>
              </section>

              {sections.map((section) => (
                <section key={section.id} id={section.id} className="mb-4 scroll-mt-28 rounded-lg px-4 py-4 transition-colors hover:bg-base-content/5">
                  <h2 className="mb-2 text-xl font-bold text-base-content">{section.title}</h2>
                  <div className="space-y-2">
                    {section.content.map((p, idx) => (
                      <p key={idx} className="text-sm leading-7 text-base-content">
                        {p}
                      </p>
                    ))}
                  </div>
                  {section.id === 'cookies' && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full overflow-hidden rounded-lg border border-base-content/15 text-sm">
                        <thead className="bg-base-content/10">
                          <tr>
                            <th className="px-3 py-2 text-left text-base-content">{isBg ? 'Име' : 'Name'}</th>
                            <th className="px-3 py-2 text-left text-base-content">{isBg ? 'Цел' : 'Purpose'}</th>
                            <th className="px-3 py-2 text-left text-base-content">{isBg ? 'Срок' : 'Expiry'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-base-content/10">
                            <td className="px-3 py-2">session_id</td>
                            <td className="px-3 py-2">{isBg ? 'Сесия и автентикация' : 'Session and authentication'}</td>
                            <td className="px-3 py-2">{isBg ? 'До края на сесията' : 'Session'}</td>
                          </tr>
                          <tr className="border-t border-base-content/10">
                            <td className="px-3 py-2">theme-preference</td>
                            <td className="px-3 py-2">{isBg ? 'Запазва предпочитаната визуална тема' : 'Persist visual theme choice'}</td>
                            <td className="px-3 py-2">{isBg ? '12 месеца' : '12 months'}</td>
                          </tr>
                          <tr className="border-t border-base-content/10">
                            <td className="px-3 py-2">language</td>
                            <td className="px-3 py-2">{isBg ? 'Запазва предпочитания език' : 'Persist language preference'}</td>
                            <td className="px-3 py-2">{isBg ? '12 месеца' : '12 months'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ))}

              <section className="mt-8 border-t border-base-content/15 pt-6">
                <a href={homeHref} className="inline-flex rounded-md border border-base-content/20 px-4 py-2 text-sm font-medium hover:bg-base-content/10">
                  {isBg ? 'Връщане към началната страница' : 'Return to Home Page'}
                </a>
              </section>
            </article>
          </div>
        </div>
      </main>
      <Footer theme={theme} language={language} />
    </>
  )
}

