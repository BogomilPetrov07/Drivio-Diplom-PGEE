import { AlertCircle, CheckCircle2, Clock, FileText, HeadphonesIcon, TrendingUp, Users, Zap } from 'lucide-react'
import { type SyntheticEvent, useState } from 'react'
import { getPublicTranslations, type Language } from '../../../i18n/public'
import { submitDrivingSchoolJoinRequest } from '../api'

const icons = [TrendingUp, Clock, FileText, Users, Zap, HeadphonesIcon]

interface ForSchoolsProps {
  language: Language
}

export default function ForSchools({ language }: ForSchoolsProps) {
  const data = getPublicTranslations(language).schools
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolAddress: '',
    schoolPhone: '',
    contactName: '',
    contactEmail: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())

  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)
    try {
      await submitDrivingSchoolJoinRequest(formData)
      setSuccessMessage(data.joinForm.success)
      setFormData({
        schoolName: '',
        schoolAddress: '',
        schoolPhone: '',
        contactName: '',
        contactEmail: '',
      })
    } catch {
      setErrorMessage(data.joinForm.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="schools" className="py-16 md:py-24 bg-base-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="badge badge-secondary badge-lg mb-4">{data.badge}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-4">{data.heading}</h2>
          <p className="text-body text-base-content/70 max-w-2xl mx-auto">{data.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {data.benefits.map((benefit, index) => {
            const Icon = icons[index]
            return (
              <div key={index} className="flex gap-4 p-6 rounded-xl bg-base-200">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    {Icon && <Icon className="w-5 h-5 text-secondary" />}
                  </div>
                </div>
                <div>
                  <h3 className="text-subheading text-base-content mb-1">{benefit.title}</h3>
                  <p className="text-helper text-base-content/70">{benefit.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mx-auto max-w-3xl rounded-2xl border border-base-content/10 bg-base-200 p-5 md:p-6 shadow-sm">
          <div className="mb-5 border-b border-base-content/10 pb-3">
            <h3 className="text-2xl font-semibold tracking-tight text-base-content">{data.joinForm.title}</h3>
            <p className="mt-2 text-base-content/70">{data.joinForm.description}</p>
          </div>

          <form className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2" onSubmit={(event) => void handleSubmit(event)}>
            <label className="flex w-full flex-col items-start gap-1 text-left md:col-span-2">
              <span className="text-sm text-base-content/80">{data.joinForm.schoolNameLabel}</span>
              <input className="input input-bordered w-full h-10 bg-base-100/80 border-base-content/20 focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all duration-200" placeholder={language === 'bg' ? 'напр. Автошкола Успех' : 'e.g., Smith Driving Academy'} value={formData.schoolName} onChange={(event) => handleChange('schoolName', event.target.value)} required />
            </label>
            <label className="flex w-full flex-col items-start gap-1 text-left">
              <span className="text-sm text-base-content/80">{data.joinForm.schoolPhoneLabel}</span>
              <input className="input input-bordered w-full h-10 bg-base-100/80 border-base-content/20 focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all duration-200" placeholder={language === 'bg' ? 'напр. +359 888 123 456' : 'e.g., +359 888 123 456'} value={formData.schoolPhone} onChange={(event) => handleChange('schoolPhone', event.target.value)} required />
            </label>
            <label className="flex w-full flex-col items-start gap-1 text-left">
              <span className="text-sm text-base-content/80">{data.joinForm.schoolAddressLabel}</span>
              <input className="input input-bordered w-full h-10 bg-base-100/80 border-base-content/20 focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all duration-200" placeholder={language === 'bg' ? 'напр. София, бул. България 10' : 'e.g., Sofia, 10 Bulgaria Blvd'} value={formData.schoolAddress} onChange={(event) => handleChange('schoolAddress', event.target.value)} required />
            </label>
            <label className="flex w-full flex-col items-start gap-1 text-left">
              <span className="text-sm text-base-content/80">{data.joinForm.contactNameLabel}</span>
              <input className="input input-bordered w-full h-10 bg-base-100/80 border-base-content/20 focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all duration-200" placeholder={language === 'bg' ? 'напр. Иван Петров' : 'e.g., John Smith'} value={formData.contactName} onChange={(event) => handleChange('contactName', event.target.value)} required />
            </label>
            <label className="flex w-full flex-col items-start gap-1 text-left">
              <span className="text-sm text-base-content/80">{data.joinForm.contactEmailLabel}</span>
              <input type="email" className="input input-bordered w-full h-10 bg-base-100/80 border-base-content/20 focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all duration-200" placeholder={language === 'bg' ? 'напр. school@email.com' : 'e.g., school@email.com'} value={formData.contactEmail} onChange={(event) => handleChange('contactEmail', event.target.value)} required />
              {formData.contactEmail.trim() ? (
                <span className={`text-xs flex items-center gap-1 ${emailIsValid ? 'text-success' : 'text-error'}`}>
                  {emailIsValid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {emailIsValid ? (language === 'bg' ? 'Валиден имейл' : 'Valid email') : (language === 'bg' ? 'Невалиден имейл' : 'Invalid email')}
                </span>
              ) : null}
            </label>

            <div className="md:col-span-2 mt-1 flex flex-col gap-3">
              <button
                type="submit"
                className="btn btn-secondary h-10 w-full md:w-1/2 mx-auto rounded-lg text-sm font-semibold transition-all duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? data.joinForm.submitting : data.joinForm.submit}
              </button>
              {successMessage ? <p className="text-xs text-success bg-success/10 border border-success/20 rounded-md px-2.5 py-2 text-center">{successMessage}</p> : null}
              {errorMessage ? <p className="text-xs text-error bg-error/10 border border-error/20 rounded-md px-2.5 py-2 text-center">{errorMessage}</p> : null}
              <p className="text-xs text-base-content/55 text-center">
                {language === 'bg' ? 'Пазим вашите данни. Без спам.' : 'We value your privacy. No spam, ever.'}
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
