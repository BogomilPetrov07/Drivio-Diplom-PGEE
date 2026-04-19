import { type SyntheticEvent, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Language } from '../../../i18n/language'
import api from '../../../services/api'

interface DrivingSchoolCompleteSetupPageProps {
  language: Language
}

type SetupSessionResponse = {
  request: {
    id: string
    schoolName: string
    schoolAddress: string
    schoolPhone: string
    contactName: string
    contactEmail: string
  }
  token: {
    expiresAt: string
    usedCount: number
    remainingUses: number
    maxUses: number
  }
}

export default function DrivingSchoolCompleteSetupPage({ language }: DrivingSchoolCompleteSetupPageProps) {
  const isBg = language === 'bg'
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams])
  const localDraftKey = useMemo(() => `drivio:school-setup:${token.slice(0, 24)}`, [token])

  const [step, setStep] = useState(1)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [sessionInfo, setSessionInfo] = useState<SetupSessionResponse | null>(null)

  const [formData, setFormData] = useState({
    schoolName: '',
    schoolAddress: '',
    schoolPhone: '',
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    wantsInstructorPrivileges: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const labels = {
    title: isBg ? 'Завършване на регистрацията на автошкола' : 'Complete Driving School Registration',
    subtitle: isBg
      ? 'Регистрацията е в 3 стъпки: данни за автошкола, лични данни и потвърждение.'
      : 'Registration has 3 steps: school details, personal account details, and final confirmation.',
    tokenHint: isBg ? 'Линкът изтича на:' : 'Link expires on:',
    tokenUses: isBg ? 'Оставащи използвания:' : 'Remaining uses:',
    step1: isBg ? '1. Данни за автошкола' : '1. School Details',
    step2: isBg ? '2. Лични данни и достъп' : '2. Personal Details & Access',
    step3: isBg ? '3. Преглед и потвърждение' : '3. Review & Confirm',
    schoolName: isBg ? 'Име на автошкола' : 'Driving school name',
    schoolAddress: isBg ? 'Адрес' : 'School address',
    schoolPhone: isBg ? 'Телефон' : 'School phone',
    name: isBg ? 'Вашето име' : 'Your name',
    email: isBg ? 'Вашият имейл' : 'Your email',
    phone: isBg ? 'Телефон (по избор)' : 'Phone (optional)',
    username: isBg ? 'Потребителско име' : 'Username',
    password: isBg ? 'Парола' : 'Password',
    instructor: isBg
      ? 'Искам и инструкторски достъп (освен администраторски)'
      : 'I need instructor access in addition to school admin access',
    next: isBg ? 'Напред' : 'Next',
    back: isBg ? 'Назад' : 'Back',
    submit: isBg ? 'Потвърди регистрацията' : 'Confirm Registration',
    submitting: isBg ? 'Регистрация...' : 'Registering...',
    success: isBg ? 'Регистрацията е завършена. Може да влезете в профила си.' : 'Registration completed. You can now sign in.',
    invalidToken: isBg ? 'Невалиден или липсващ токен.' : 'Invalid or missing setup token.',
    sessionError: isBg ? 'Неуспешно зареждане на сесията за регистрация.' : 'Could not load registration session.',
    submitError: isBg ? 'Регистрацията не можа да бъде завършена.' : 'Could not complete registration.',
    reviewTitle: isBg ? 'Проверете въведената информация:' : 'Please review the entered information:',
    yes: isBg ? 'Да' : 'Yes',
    no: isBg ? 'Не' : 'No',
  }

  const handleChange = (key: keyof typeof formData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    const loadSession = async () => {
      setError('')
      if (!token) {
        setError(labels.invalidToken)
        setIsLoadingSession(false)
        return
      }

      try {
        const { data } = await api.get<SetupSessionResponse>('/onboarding/setup-session', { params: { token } })
        const maybeSavedDraft = sessionStorage.getItem(localDraftKey)
        const savedDraft = maybeSavedDraft ? JSON.parse(maybeSavedDraft) as typeof formData : null

        setSessionInfo(data)
        setFormData({
          schoolName: savedDraft?.schoolName ?? data.request.schoolName,
          schoolAddress: savedDraft?.schoolAddress ?? data.request.schoolAddress,
          schoolPhone: savedDraft?.schoolPhone ?? data.request.schoolPhone,
          name: savedDraft?.name ?? data.request.contactName,
          email: savedDraft?.email ?? data.request.contactEmail,
          phone: savedDraft?.phone ?? '',
          username: savedDraft?.username ?? '',
          password: savedDraft?.password ?? '',
          wantsInstructorPrivileges: Boolean(savedDraft?.wantsInstructorPrivileges),
        })
      } catch {
        setError(labels.sessionError)
      } finally {
        setIsLoadingSession(false)
      }
    }

    void loadSession()
  }, [localDraftKey, token])

  useEffect(() => {
    if (!sessionInfo) return
    sessionStorage.setItem(localDraftKey, JSON.stringify(formData))
  }, [formData, localDraftKey, sessionInfo])

  const goNext = () => {
    if (step === 1 && (!formData.schoolName.trim() || !formData.schoolAddress.trim() || !formData.schoolPhone.trim())) {
      setError(labels.submitError)
      return
    }
    if (step === 2 && (!formData.name.trim() || !formData.email.trim() || !formData.username.trim() || !formData.password.trim())) {
      setError(labels.submitError)
      return
    }
    setError('')
    setStep((prev) => Math.min(prev + 1, 3))
  }

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    // Do not allow accidental submit (e.g. pressing Enter) before final review step.
    if (step !== 3) {
      return
    }

    if (!token) {
      setError(labels.invalidToken)
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/onboarding/complete', {
        token,
        ...formData,
      })
      sessionStorage.removeItem(localDraftKey)
      setSuccess(labels.success)
    } catch {
      setError(labels.submitError)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingSession) {
    return (
      <main className="min-h-screen bg-base-200 px-4 py-24">
        <section className="mx-auto w-full max-w-3xl rounded-2xl border border-base-300 bg-base-100 p-8 shadow-xl">
          <div className="skeleton h-10 w-80" />
          <div className="mt-4 skeleton h-5 w-full" />
          <div className="mt-2 skeleton h-5 w-2/3" />
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-base-200 px-4 py-24">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-primary/20 bg-gradient-to-b from-base-100 to-base-200 p-8 shadow-xl">
        <h1 className="text-3xl font-bold text-base-content">{labels.title}</h1>
        <p className="mt-2 text-base-content/70">{labels.subtitle}</p>

        {sessionInfo ? (
          <div className="mt-4 rounded-xl border border-base-300 bg-base-100/80 p-4 text-sm">
            <p><span className="font-semibold">{labels.tokenHint}</span> {new Date(sessionInfo.token.expiresAt).toLocaleString()}</p>
            <p className="mt-1"><span className="font-semibold">{labels.tokenUses}</span> {sessionInfo.token.remainingUses}/{sessionInfo.token.maxUses}</p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2 text-sm">
          <span className={`rounded-full px-3 py-1 ${step === 1 ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'}`}>{labels.step1}</span>
          <span className={`rounded-full px-3 py-1 ${step === 2 ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'}`}>{labels.step2}</span>
          <span className={`rounded-full px-3 py-1 ${step === 3 ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/70'}`}>{labels.step3}</span>
        </div>

        <form
          className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"
          onSubmit={(event) => void handleSubmit(event)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && step < 3) {
              event.preventDefault()
            }
          }}
        >
          {step === 1 ? (
            <>
              <label className="form-control md:col-span-2">
                <span className="label-text">{labels.schoolName}</span>
                <input className="input input-bordered" required value={formData.schoolName} onChange={(event) => handleChange('schoolName', event.target.value)} />
              </label>
              <label className="form-control md:col-span-2">
                <span className="label-text">{labels.schoolAddress}</span>
                <input className="input input-bordered" required value={formData.schoolAddress} onChange={(event) => handleChange('schoolAddress', event.target.value)} />
              </label>
              <label className="form-control">
                <span className="label-text">{labels.schoolPhone}</span>
                <input className="input input-bordered" required value={formData.schoolPhone} onChange={(event) => handleChange('schoolPhone', event.target.value)} />
              </label>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <label className="form-control">
                <span className="label-text">{labels.name}</span>
                <input className="input input-bordered" required value={formData.name} onChange={(event) => handleChange('name', event.target.value)} />
              </label>
              <label className="form-control">
                <span className="label-text">{labels.email}</span>
                <input type="email" className="input input-bordered" required value={formData.email} onChange={(event) => handleChange('email', event.target.value)} />
              </label>
              <label className="form-control">
                <span className="label-text">{labels.phone}</span>
                <input className="input input-bordered" value={formData.phone} onChange={(event) => handleChange('phone', event.target.value)} />
              </label>
              <label className="form-control">
                <span className="label-text">{labels.username}</span>
                <input className="input input-bordered" required value={formData.username} onChange={(event) => handleChange('username', event.target.value)} />
              </label>
              <label className="form-control md:col-span-2">
                <span className="label-text">{labels.password}</span>
                <input type="password" className="input input-bordered" required value={formData.password} onChange={(event) => handleChange('password', event.target.value)} />
              </label>
              <label className="label cursor-pointer md:col-span-2 justify-start gap-3 rounded-lg border border-base-300 bg-base-100 p-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={formData.wantsInstructorPrivileges}
                  onChange={(event) => handleChange('wantsInstructorPrivileges', event.target.checked)}
                />
                <span className="label-text">{labels.instructor}</span>
              </label>
            </>
          ) : null}

          {step === 3 ? (
            <div className="md:col-span-2 rounded-xl border border-base-300 bg-base-100 p-4 text-sm">
              <p className="mb-3 font-semibold">{labels.reviewTitle}</p>
              <p><span className="font-semibold">{labels.schoolName}:</span> {formData.schoolName}</p>
              <p><span className="font-semibold">{labels.schoolAddress}:</span> {formData.schoolAddress}</p>
              <p><span className="font-semibold">{labels.schoolPhone}:</span> {formData.schoolPhone}</p>
              <p><span className="font-semibold">{labels.name}:</span> {formData.name}</p>
              <p><span className="font-semibold">{labels.email}:</span> {formData.email}</p>
              <p><span className="font-semibold">{labels.phone}:</span> {formData.phone || '-'}</p>
              <p><span className="font-semibold">{labels.username}:</span> {formData.username}</p>
              <p><span className="font-semibold">{labels.instructor}:</span> {formData.wantsInstructorPrivileges ? labels.yes : labels.no}</p>
            </div>
          ) : null}

          <div className="md:col-span-2 mt-2 flex gap-2">
            {step > 1 ? (
              <button type="button" className="btn btn-outline" onClick={() => setStep((prev) => Math.max(prev - 1, 1))}>
                {labels.back}
              </button>
            ) : null}
            {step < 3 ? (
              <button type="button" className="btn btn-primary" onClick={goNext}>
                {labels.next}
              </button>
            ) : (
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? labels.submitting : labels.submit}
              </button>
            )}
          </div>
        </form>

        {success ? <p className="mt-4 text-success">{success}</p> : null}
        {error ? <p className="mt-4 text-error">{error}</p> : null}
      </section>
    </main>
  )
}
