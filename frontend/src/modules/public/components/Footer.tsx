import { AlertCircle, CheckCircle2, Mail } from 'lucide-react'
import { type SyntheticEvent, useState } from 'react'
import { getPublicTranslations, type Language } from '../../../i18n/public'
import logoDark from '../../../assets/logo_dark.svg'
import logoLight from '../../../assets/logo_light.svg'
import { getDomainAwareUrl } from '../../../utils/app-domain'
import { submitPublicQuestion } from '../api'

interface FooterProps {
  theme: 'drivio-light' | 'drivio-dark'
  language: Language
}

export default function Footer({ theme, language }: FooterProps) {
  const data = getPublicTranslations(language).footer
  const questionForm = data.questionForm
  const homeHref = getDomainAwareUrl('/')
  const privacyHref = getDomainAwareUrl('/privacy')
  const termsHref = getDomainAwareUrl('/terms')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    question: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const nameIsValid = formData.name.trim().length >= 2
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
  const questionIsValid = formData.question.trim().length >= 10

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

  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)
    try {
      await submitPublicQuestion(formData)
      setSuccessMessage(questionForm.success)
      setFormData({ name: '', email: '', question: '' })
    } catch {
      setErrorMessage(questionForm.error)
    } finally {
      setIsSubmitting(false)
    }
  }

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
            <div className="h-full rounded-2xl border border-base-content/10 bg-base-100/80 p-4 md:p-5 shadow-sm">
              <div className="mb-4 pb-3 border-b border-base-content/10">
                <h4 className="text-xl font-semibold tracking-tight text-base-content">{questionForm.title}</h4>
                <p className="text-helper text-base-content/70 mt-1">{questionForm.description}</p>
              </div>
              <form className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-5" onSubmit={(event) => void handleSubmit(event)}>
                <label className="flex w-full flex-col items-start gap-1 text-left md:col-span-1">
                  <span className="text-sm text-base-content/80">{questionForm.nameLabel}</span>
                  <input
                    className="input input-bordered w-full h-10 bg-base-100/80 border-base-content/20 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                    value={formData.name}
                    placeholder={language === 'bg' ? 'напр. Иван Петров' : 'e.g., John Smith'}
                    onChange={(event) => handleChange('name', event.target.value)}
                    required
                  />
                  {formData.name.trim() ? (
                    <span className={`text-xs flex items-center gap-1 ${nameIsValid ? 'text-success' : 'text-error'}`}>
                      {nameIsValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {nameIsValid ? (language === 'bg' ? 'Изглежда добре' : 'Looks good') : (language === 'bg' ? 'Поне 2 символа' : 'At least 2 characters')}
                    </span>
                  ) : null}
                </label>
                <label className="flex w-full flex-col items-start gap-1 text-left">
                  <span className="text-sm text-base-content/80">{questionForm.emailLabel}</span>
                  <input
                    type="email"
                    className="input input-bordered w-full h-10 bg-base-100/80 border-base-content/20 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                    value={formData.email}
                    placeholder={language === 'bg' ? 'напр. ivan@email.com' : 'e.g., john@email.com'}
                    onChange={(event) => handleChange('email', event.target.value)}
                    required
                  />
                  {formData.email.trim() ? (
                    <span className={`text-xs flex items-center gap-1 ${emailIsValid ? 'text-success' : 'text-error'}`}>
                      {emailIsValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {emailIsValid ? (language === 'bg' ? 'Валиден имейл' : 'Valid email') : (language === 'bg' ? 'Невалиден имейл' : 'Invalid email')}
                    </span>
                  ) : null}
                </label>
                <label className="flex w-full flex-col items-start gap-1 text-left md:col-span-2">
                  <span className="text-sm text-base-content/80">{questionForm.questionLabel}</span>
                  <textarea
                    className="textarea textarea-bordered w-full min-h-24 bg-base-100/80 border-base-content/20 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all duration-200"
                    placeholder={questionForm.questionPlaceholder}
                    value={formData.question}
                    onChange={(event) => handleChange('question', event.target.value)}
                    required
                  />
                  {formData.question.trim() ? (
                    <span className={`text-xs flex items-center gap-1 ${questionIsValid ? 'text-success' : 'text-error'}`}>
                      {questionIsValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {questionIsValid ? (language === 'bg' ? 'Готово за изпращане' : 'Ready to submit') : (language === 'bg' ? 'Поне 10 символа' : 'At least 10 characters')}
                    </span>
                  ) : null}
                </label>
                <div className="md:col-span-2 mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary h-10 w-full sm:w-1/2 px-5 text-sm font-semibold rounded-lg transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? questionForm.submitting : questionForm.submit}
                  </button>
                  <div className="flex flex-wrap items-center gap-2 text-helper text-base-content/70 text-sm">
                    <Mail className="w-4 h-4 text-primary/90" />
                    <span>{questionForm.directEmailPrefix}</span>
                    <a href="mailto:info@drivio.bg" className="font-medium text-primary hover:opacity-85 transition-opacity duration-150">
                      info@drivio.bg
                    </a>
                  </div>
                </div>
                {successMessage ? <p className="md:col-span-2 text-xs text-success bg-success/10 border border-success/20 rounded-md px-2.5 py-2">{successMessage}</p> : null}
                {errorMessage ? <p className="md:col-span-2 text-xs text-error bg-error/10 border border-error/20 rounded-md px-2.5 py-2">{errorMessage}</p> : null}
                <p className="md:col-span-2 text-xs text-base-content/55">
                  {language === 'bg' ? 'Пазим вашите данни. Без спам.' : 'We value your privacy. No spam, ever.'}{' '}
                  <a href={privacyHref} className="text-primary hover:opacity-85 transition-opacity duration-150">
                    {language === 'bg' ? 'Политика за поверителност' : 'Privacy Policy'}
                  </a>
                </p>
              </form>
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
                {language === 'bg' ? 'Поверителност' : 'Privacy'}
              </a>
              <a href={termsHref} className="text-helper text-base-content/65 hover:opacity-80 transition-opacity duration-150">
                {language === 'bg' ? 'Условия' : 'Terms'}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
