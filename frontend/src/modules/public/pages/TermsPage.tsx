import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Language } from '../../../i18n/public'
import Footer from '../components/Footer'

interface TermsPageProps {
  language: Language
  theme: 'drivio-pro-light' | 'drivio-pro-dark'
}

type Section = {
  id: string
  title: string
  content: string[]
}

export default function TermsPage({ language, theme }: TermsPageProps) {
  const isBg = language === 'bg'
  const [activeId, setActiveId] = useState('acceptance')

  const sections = useMemo<Section[]>(
    () => [
      {
        id: 'acceptance',
        title: isBg ? '1.0 Приемане на условията' : '1.0 Acceptance of Terms',
        content: isBg
          ? [
              'С достъп или използване на Drivio приемате настоящите условия и се съгласявате да ги спазвате.',
              'Ако не приемате условията, не следва да използвате платформата.',
            ]
          : [
              'By accessing or using Drivio, you agree to these Terms and to comply with them.',
              'If you do not agree, you must not use the platform.',
            ],
      },
      {
        id: 'accounts',
        title: isBg ? '2.0 Акаунти и достъп' : '2.0 Accounts and Access',
        content: isBg
          ? [
              'Потребителите са отговорни за сигурността на своите акаунти и за действията, извършени чрез тях.',
              'Запазваме право да ограничим или прекратим достъпа при нарушения, риск за сигурността или злоупотреба.',
            ]
          : [
              'Users are responsible for account security and all actions performed through their accounts.',
              'We may restrict or terminate access in case of violations, security risks, or abuse.',
            ],
      },
      {
        id: 'use',
        title: isBg ? '3.0 Допустима употреба' : '3.0 Acceptable Use',
        content: isBg
          ? [
              'Забранени са опити за неоторизиран достъп, reverse engineering, автоматизирани атаки, злонамерено съдържание и нарушаване на права на трети страни.',
              'Платформата следва да се използва само за законни и професионални цели, свързани с предоставяните услуги.',
            ]
          : [
              'Unauthorized access attempts, reverse engineering, automated attacks, malicious content, and third-party rights violations are prohibited.',
              'The platform must be used only for lawful, professional purposes related to the provided services.',
            ],
      },
      {
        id: 'billing',
        title: isBg ? '4.0 Планове, таксуване и промени' : '4.0 Plans, Billing, and Changes',
        content: isBg
          ? [
              'Някои функционалности може да изискват активен платен план. Таксите, цикълът на таксуване и лимитите се определят в приложимия план.',
              'Можем да актуализираме функционалности, цени или условия при разумно предварително уведомление.',
            ]
          : [
              'Some features may require an active paid plan. Fees, billing cycle, and limits are defined by your applicable plan.',
              'We may update features, pricing, or terms with reasonable prior notice.',
            ],
      },
      {
        id: 'ip',
        title: isBg ? '5.0 Интелектуална собственост' : '5.0 Intellectual Property',
        content: isBg
          ? [
              'Всички права върху Drivio, включително софтуер, дизайн, търговски марки и съдържание, са запазени.',
              'Не придобивате права на собственост върху платформата, освен ограничено право на използване съгласно тези условия.',
            ]
          : [
              'All rights to Drivio, including software, design, trademarks, and content, are reserved.',
              'You do not obtain ownership rights in the platform, only a limited right to use it under these Terms.',
            ],
      },
      {
        id: 'liability',
        title: isBg ? '6.0 Ограничаване на отговорността' : '6.0 Limitation of Liability',
        content: isBg
          ? [
              'До степента, разрешена от закона, Drivio не носи отговорност за непреки, случайни или последващи вреди.',
              'Общата отговорност на Drivio е ограничена до сумите, платени от вас за услугата за последните 12 месеца.',
            ]
          : [
              'To the extent permitted by law, Drivio is not liable for indirect, incidental, or consequential damages.',
              'Drivio total liability is limited to amounts paid by you for the service in the previous 12 months.',
            ],
      },
      {
        id: 'termination',
        title: isBg ? '7.0 Прекратяване' : '7.0 Termination',
        content: isBg
          ? [
              'Можете да прекратите използването по всяко време. Ние можем да прекратим достъпа при нарушение на условията.',
              'При прекратяване определени данни може да бъдат запазени според законовите изисквания и политиката за поверителност.',
            ]
          : [
              'You may stop using the service at any time. We may terminate access in case of Terms violations.',
              'Upon termination, some data may be retained as required by law and our privacy policy.',
            ],
      },
      {
        id: 'contact',
        title: isBg ? '8.0 Контакт и приложимо право' : '8.0 Contact and Governing Law',
        content: isBg
          ? [
              'За въпроси относно условията се свържете с нас на info@drivio.bg.',
              'Тези условия се тълкуват и прилагат съгласно приложимото законодателство.',
            ]
          : [
              'For terms-related questions, contact us at info@drivio.bg.',
              'These Terms are interpreted and enforced under applicable law.',
            ],
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
      let nextActiveId = sections[0]?.id ?? 'acceptance'

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
                <h1 className="text-3xl font-bold text-base-content md:text-4xl">{isBg ? 'Условия за ползване' : 'Terms of Service'}</h1>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-base-content/20 px-3 py-1 text-xs text-base-content/85">
                    {isBg ? 'Обновено: 21.03.2026' : 'Last Updated: 2026-03-21'}
                  </span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="rounded-md border border-base-content/20 px-3 py-1 text-xs text-base-content transition-colors hover:bg-base-content/10"
                  >
                    {isBg ? 'Печат / PDF' : 'Print to PDF'}
                  </button>
                </div>
              </header>

              <section className="mb-7 rounded-xl border border-base-content/15 bg-base-200/30 p-5">
                <h2 className="mb-3 text-base font-semibold text-base-content">{isBg ? 'Бързо обобщение' : 'Quick Summary'}</h2>
                <ul className="space-y-2 text-sm text-base-content/90">
                  <li>{isBg ? 'Използвайте платформата само за законни и професионални цели.' : 'Use the platform only for lawful, professional purposes.'}</li>
                  <li>{isBg ? 'Пазете сигурността на акаунта си и данните за достъп.' : 'Keep your account secure and protect access credentials.'}</li>
                  <li>{isBg ? 'Нарушенията може да доведат до ограничен или прекратен достъп.' : 'Violations may lead to restricted or terminated access.'}</li>
                  <li>{isBg ? 'При въпроси: info@drivio.bg.' : 'Questions: info@drivio.bg.'}</li>
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
                </section>
              ))}

              <section className="mt-8 border-t border-base-content/15 pt-6">
                <Link to="/" className="inline-flex rounded-md border border-base-content/20 px-4 py-2 text-sm font-medium hover:bg-base-content/10">
                  {isBg ? 'Обратно към началната страница' : 'Return to Home Page'}
                </Link>
              </section>
            </article>
          </div>
        </div>
      </main>
      <Footer theme={theme} language={language} />
    </>
  )
}
