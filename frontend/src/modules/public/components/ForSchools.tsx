import { Clock, FileText, HeadphonesIcon, TrendingUp, Users, Zap } from 'lucide-react'
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

        <div className="mx-auto max-w-3xl rounded-2xl border border-base-300 bg-base-200 p-6">
          <h3 className="text-2xl font-bold text-base-content">{data.joinForm.title}</h3>
          <p className="mt-2 text-base-content/70">{data.joinForm.description}</p>

          <form className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(event) => void handleSubmit(event)}>
            <label className="form-control">
              <span className="label-text">{data.joinForm.schoolNameLabel}</span>
              <input className="input input-bordered" value={formData.schoolName} onChange={(event) => handleChange('schoolName', event.target.value)} required />
            </label>
            <label className="form-control">
              <span className="label-text">{data.joinForm.schoolAddressLabel}</span>
              <input className="input input-bordered" value={formData.schoolAddress} onChange={(event) => handleChange('schoolAddress', event.target.value)} required />
            </label>
            <label className="form-control">
              <span className="label-text">{data.joinForm.schoolPhoneLabel}</span>
              <input className="input input-bordered" value={formData.schoolPhone} onChange={(event) => handleChange('schoolPhone', event.target.value)} required />
            </label>
            <label className="form-control">
              <span className="label-text">{data.joinForm.contactNameLabel}</span>
              <input className="input input-bordered" value={formData.contactName} onChange={(event) => handleChange('contactName', event.target.value)} required />
            </label>
            <label className="form-control md:col-span-2">
              <span className="label-text">{data.joinForm.contactEmailLabel}</span>
              <input type="email" className="input input-bordered" value={formData.contactEmail} onChange={(event) => handleChange('contactEmail', event.target.value)} required />
            </label>

            <div className="md:col-span-2 flex items-center justify-between gap-3">
              <button type="submit" className="btn btn-secondary btn-lg" disabled={isSubmitting}>
                {isSubmitting ? data.joinForm.submitting : data.joinForm.submit}
              </button>
              {successMessage ? <p className="text-sm text-success">{successMessage}</p> : null}
              {errorMessage ? <p className="text-sm text-error">{errorMessage}</p> : null}
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
