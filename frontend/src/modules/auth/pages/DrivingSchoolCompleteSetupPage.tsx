import { type SyntheticEvent, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAuthTranslations } from '../../../i18n/auth'
import type { Language } from '../../../i18n/language'
import api from '../../../services/api'

interface DrivingSchoolCompleteSetupPageProps {
  language: Language
}

export default function DrivingSchoolCompleteSetupPage({ language }: DrivingSchoolCompleteSetupPageProps) {
  const text = getAuthTranslations(language).completeSetup
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams])

  const [formData, setFormData] = useState({
    schoolName: '',
    schoolAddress: '',
    schoolPhone: '',
    username: '',
    password: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!token) {
      setError(text.invalidToken)
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/onboarding/complete', {
        token,
        ...formData,
      })
      setSuccess(text.success)
    } catch {
      setError(text.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-base-200 px-4 py-24">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-base-300 bg-base-100 p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-base-content">{text.title}</h1>
        <p className="mt-2 text-base-content/70">{text.subtitle}</p>

        <form className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={(event) => void handleSubmit(event)}>
          <label className="form-control">
            <span className="label-text">{text.schoolNameLabel}</span>
            <input className="input input-bordered" required value={formData.schoolName} onChange={(event) => handleChange('schoolName', event.target.value)} />
          </label>
          <label className="form-control">
            <span className="label-text">{text.schoolAddressLabel}</span>
            <input className="input input-bordered" required value={formData.schoolAddress} onChange={(event) => handleChange('schoolAddress', event.target.value)} />
          </label>
          <label className="form-control">
            <span className="label-text">{text.schoolPhoneLabel}</span>
            <input className="input input-bordered" required value={formData.schoolPhone} onChange={(event) => handleChange('schoolPhone', event.target.value)} />
          </label>
          <label className="form-control">
            <span className="label-text">{text.usernameLabel}</span>
            <input className="input input-bordered" required value={formData.username} onChange={(event) => handleChange('username', event.target.value)} />
          </label>
          <label className="form-control md:col-span-2">
            <span className="label-text">{text.passwordLabel}</span>
            <input type="password" className="input input-bordered" required value={formData.password} onChange={(event) => handleChange('password', event.target.value)} />
          </label>

          <div className="md:col-span-2">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? text.submitting : text.submit}
            </button>
          </div>
        </form>

        {success ? <p className="mt-4 text-success">{success}</p> : null}
        {error ? <p className="mt-4 text-error">{error}</p> : null}
      </section>
    </main>
  )
}
