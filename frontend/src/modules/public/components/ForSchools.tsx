import { AlertCircle, CheckCircle2, ChevronDown, Clock, FileText, HeadphonesIcon, TrendingUp, Users, Zap } from 'lucide-react'
import { type SyntheticEvent, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { getPublicTranslations, type Language } from '../../../i18n/public'
import { submitDrivingSchoolJoinRequest } from '../api'
import { BULGARIAN_REGIONS } from '../bulgaria'

const icons = [TrendingUp, Clock, FileText, Users, Zap, HeadphonesIcon]

interface ForSchoolsProps {
  language: Language
}

function buildSchoolAddress(city: string, street: string, streetNumber: string) {
  const parts = [city.trim(), street.trim(), streetNumber.trim() ? `№ ${streetNumber.trim()}` : ''].filter(Boolean)
  return parts.join(', ')
}

export default function ForSchools({ language }: ForSchoolsProps) {
  const data = getPublicTranslations(language).schools
  const regionFieldRef = useRef<HTMLDivElement | null>(null)
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolRegion: '',
    schoolCity: '',
    schoolStreet: '',
    schoolStreetNumber: '',
    schoolPhone: '',
    contactEmail: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isRegionOpen, setIsRegionOpen] = useState(false)
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())

  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    if (!isRegionOpen) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!regionFieldRef.current?.contains(event.target as Node)) {
        setIsRegionOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsRegionOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isRegionOpen])

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setIsSubmitting(true)
    try {
      await submitDrivingSchoolJoinRequest({
        schoolName: formData.schoolName,
        schoolRegion: formData.schoolRegion,
        schoolCity: formData.schoolCity,
        schoolAddress: buildSchoolAddress(formData.schoolCity, formData.schoolStreet, formData.schoolStreetNumber),
        schoolPhone: formData.schoolPhone,
        contactEmail: formData.contactEmail,
      })
      setSuccessMessage(data.joinForm.success)
      setFormData({
        schoolName: '',
        schoolRegion: '',
        schoolCity: '',
        schoolStreet: '',
        schoolStreetNumber: '',
        schoolPhone: '',
        contactEmail: '',
      })
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setErrorMessage(data.joinForm.emailExists)
      } else {
        setErrorMessage(data.joinForm.error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="schools" className="bg-base-100 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <span className="badge badge-secondary badge-lg mb-4">{data.badge}</span>
          <h2 className="mb-4 text-3xl font-bold text-base-content md:text-4xl">{data.heading}</h2>
          <p className="mx-auto max-w-2xl text-body text-base-content/70">{data.description}</p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.benefits.map((benefit, index) => {
            const Icon = icons[index]
            return (
              <div key={index} className="flex gap-4 rounded-xl bg-base-200 p-6">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                    {Icon && <Icon className="h-5 w-5 text-secondary" />}
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 text-subheading text-base-content">{benefit.title}</h3>
                  <p className="text-helper text-base-content/70">{benefit.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mx-auto max-w-3xl rounded-2xl border border-base-content/10 bg-base-200 p-5 shadow-sm md:p-6">
          <div className="mb-5 border-b border-base-content/10 pb-3">
            <h3 className="text-2xl font-semibold tracking-tight text-base-content">{data.joinForm.title}</h3>
            <p className="mt-2 text-base-content/70">{data.joinForm.description}</p>
          </div>

          <form className="grid grid-cols-1 gap-x-5 gap-y-5 md:grid-cols-2" onSubmit={(event) => void handleSubmit(event)}>
            <label className="flex w-full flex-col items-start gap-1 text-left md:col-span-2">
              <span className="text-sm text-base-content/80">{data.joinForm.schoolNameLabel}</span>
              <input className="input input-bordered h-10 w-full border-base-content/20 bg-base-100/80 transition-all duration-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20" placeholder={language === 'bg' ? 'напр. Автошкола Успех' : 'e.g., Smith Driving Academy'} value={formData.schoolName} onChange={(event) => handleChange('schoolName', event.target.value)} required />
            </label>

            <div ref={regionFieldRef} className="relative flex w-full flex-col items-start gap-1 text-left md:col-span-2">
              <span className="text-sm text-base-content/80">{data.joinForm.schoolRegionLabel}</span>
              <button
                type="button"
                className="flex h-10 w-full items-center justify-between rounded-lg border border-base-content/20 bg-base-100/80 px-3 text-left text-base-content transition-all duration-200 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/20"
                onClick={() => setIsRegionOpen((current) => !current)}
                aria-expanded={isRegionOpen}
                aria-haspopup="listbox"
              >
                <span className={formData.schoolRegion ? 'text-base-content' : 'text-base-content/55'}>
                  {formData.schoolRegion || data.joinForm.schoolRegionPlaceholder}
                </span>
                <ChevronDown className={`h-4 w-4 text-base-content/60 transition-transform ${isRegionOpen ? 'rotate-180' : ''}`} />
              </button>
              <input type="hidden" name="schoolRegion" value={formData.schoolRegion} required />

              {isRegionOpen ? (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-base-content/15 bg-base-100 shadow-xl">
                  <div className="max-h-64 overflow-y-auto py-1" role="listbox" aria-label={data.joinForm.schoolRegionLabel}>
                    {BULGARIAN_REGIONS.map((region) => (
                      <button
                        key={region}
                        type="button"
                        className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors hover:bg-base-200 ${
                          formData.schoolRegion === region ? 'bg-secondary/10 font-medium text-secondary' : 'text-base-content'
                        }`}
                        onClick={() => {
                          handleChange('schoolRegion', region)
                          setIsRegionOpen(false)
                        }}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <label className="flex w-full flex-col items-start gap-1 text-left">
              <span className="text-sm text-base-content/80">{data.joinForm.schoolCityLabel}</span>
              <input className="input input-bordered h-10 w-full border-base-content/20 bg-base-100/80 transition-all duration-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20" placeholder={language === 'bg' ? 'напр. Пловдив' : 'e.g., Plovdiv'} value={formData.schoolCity} onChange={(event) => handleChange('schoolCity', event.target.value)} required />
            </label>

            <label className="flex w-full flex-col items-start gap-1 text-left">
              <span className="text-sm text-base-content/80">{data.joinForm.schoolPhoneLabel}</span>
              <input className="input input-bordered h-10 w-full border-base-content/20 bg-base-100/80 transition-all duration-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20" placeholder={language === 'bg' ? 'напр. +359 888 123 456' : 'e.g., +359 888 123 456'} value={formData.schoolPhone} onChange={(event) => handleChange('schoolPhone', event.target.value)} required />
            </label>

            <label className="flex w-full flex-col items-start gap-1 text-left">
              <span className="text-sm text-base-content/80">{data.joinForm.schoolStreetLabel}</span>
              <input className="input input-bordered h-10 w-full border-base-content/20 bg-base-100/80 transition-all duration-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20" placeholder={language === 'bg' ? 'напр. бул. България' : 'e.g., Bulgaria Blvd'} value={formData.schoolStreet} onChange={(event) => handleChange('schoolStreet', event.target.value)} required />
            </label>

            <label className="flex w-full flex-col items-start gap-1 text-left">
              <span className="text-sm text-base-content/80">{data.joinForm.schoolStreetNumberLabel}</span>
              <input className="input input-bordered h-10 w-full border-base-content/20 bg-base-100/80 transition-all duration-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20" placeholder={language === 'bg' ? 'напр. 10' : 'e.g., 10'} value={formData.schoolStreetNumber} onChange={(event) => handleChange('schoolStreetNumber', event.target.value)} />
            </label>

            <label className="flex w-full flex-col items-start gap-1 text-left md:col-span-2">
              <span className="text-sm text-base-content/80">{data.joinForm.contactEmailLabel}</span>
              <input type="email" className="input input-bordered h-10 w-full border-base-content/20 bg-base-100/80 transition-all duration-200 focus:border-secondary focus:ring-1 focus:ring-secondary/20" placeholder={language === 'bg' ? 'напр. school@email.com' : 'e.g., school@email.com'} value={formData.contactEmail} onChange={(event) => handleChange('contactEmail', event.target.value)} required />
              {formData.contactEmail.trim() ? (
                <span className={`flex items-center gap-1 text-xs ${emailIsValid ? 'text-success' : 'text-error'}`}>
                  {emailIsValid ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  {emailIsValid ? (language === 'bg' ? 'Валиден имейл' : 'Valid email') : (language === 'bg' ? 'Невалиден имейл' : 'Invalid email')}
                </span>
              ) : null}
            </label>

            <div className="mt-3 flex flex-col items-center gap-4 md:col-span-2">
              <button
                type="submit"
                className="inline-flex h-12 w-full max-w-[450px] items-center justify-center rounded-xl border border-[#74adf7] bg-[#5f9ef0] px-6 text-base font-semibold text-[#0b1324] shadow-[0_6px_0_rgba(53,102,173,0.45)] transition-all duration-200 hover:bg-[#69a5f2] focus:outline-none focus:ring-2 focus:ring-[#5f9ef0]/30 disabled:cursor-not-allowed disabled:opacity-70 md:w-[450px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? data.joinForm.submitting : data.joinForm.submit}
              </button>
              {successMessage ? <p className="text-sm text-success text-center">{successMessage}</p> : null}
              {errorMessage ? <p className="text-sm text-error text-center">{errorMessage}</p> : null}
              <p className="text-sm font-medium text-base-content/60 text-center">
                {language === 'bg' ? 'Пазим вашите данни. Без спам.' : 'We value your privacy. No spam, ever.'}
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
