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
      <main className="min-h-screen bg-base-200/60 px-4 py-14 sm:py-20">
        <section className="mx-auto w-full max-w-5xl rounded-3xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-6 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.8)] sm:p-8">
          <div className="skeleton h-10 w-96 max-w-full rounded-xl" />
          <div className="mt-4 skeleton h-5 w-full rounded-lg" />
          <div className="mt-2 skeleton h-5 w-2/3 rounded-lg" />
          <div className="mt-6 skeleton h-28 w-full rounded-2xl" />
        </section>
      </main>
    )
  }

  const stepLabels = [labels.step1, labels.step2, labels.step3]

  return (
    <main className="min-h-screen bg-base-200/60 px-4 py-14 sm:py-20">
      <section className="mx-auto w-full max-w-5xl rounded-3xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/70 p-6 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.8)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-base-content sm:text-5xl">{labels.title}</h1>
            <p className="mt-3 max-w-2xl text-base text-base-content/70 sm:text-lg">{labels.subtitle}</p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary">
            Drivio Setup
          </div>
        </div>

        {sessionInfo ? (
          <div className="mt-6 grid gap-3 rounded-2xl border border-base-300/80 bg-base-100/85 p-4 sm:grid-cols-2 sm:p-5">
            <article className="rounded-xl border border-base-300/70 bg-base-100/90 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-base-content/55">{labels.tokenHint}</p>
              <p className="mt-1 text-sm font-semibold text-base-content">{new Date(sessionInfo.token.expiresAt).toLocaleString()}</p>
            </article>
            <article className="rounded-xl border border-base-300/70 bg-base-100/90 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-base-content/55">{labels.tokenUses}</p>
              <p className="mt-1 text-sm font-semibold text-base-content">{sessionInfo.token.remainingUses}/{sessionInfo.token.maxUses}</p>
            </article>
          </div>
        ) : null}

        <div className="mt-6">
          <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-base-300/70">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {stepLabels.map((item, index) => {
              const stepNumber = index + 1
              const isActive = stepNumber === step
              const isDone = stepNumber < step
              return (
                <div
                  key={item}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-primary/40 bg-primary/15 text-primary'
                      : isDone
                        ? 'border-success/30 bg-success/10 text-success'
                        : 'border-base-300/80 bg-base-100/70 text-base-content/70'
                  }`}
                >
                  {item}
                </div>
              )
            })}
          </div>
        </div>

        <form
          className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-base-300/80 bg-base-100/85 p-4 md:grid-cols-2 md:p-5"
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
                <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/65">{labels.schoolName}</span>
                <input className="input input-bordered h-12 rounded-xl border-base-300 bg-base-100/90" required value={formData.schoolName} onChange={(event) => handleChange('schoolName', event.target.value)} />
              </label>
              <label className="form-control md:col-span-2">
                <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/65">{labels.schoolAddress}</span>
                <input className="input input-bordered h-12 rounded-xl border-base-300 bg-base-100/90" required value={formData.schoolAddress} onChange={(event) => handleChange('schoolAddress', event.target.value)} />
              </label>
              <label className="form-control">
                <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/65">{labels.schoolPhone}</span>
                <input className="input input-bordered h-12 rounded-xl border-base-300 bg-base-100/90" required value={formData.schoolPhone} onChange={(event) => handleChange('schoolPhone', event.target.value)} />
              </label>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <label className="form-control">
                <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/65">{labels.name}</span>
                <input className="input input-bordered h-12 rounded-xl border-base-300 bg-base-100/90" required value={formData.name} onChange={(event) => handleChange('name', event.target.value)} />
              </label>
              <label className="form-control">
                <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/65">{labels.email}</span>
                <input type="email" className="input input-bordered h-12 rounded-xl border-base-300 bg-base-100/90" required value={formData.email} onChange={(event) => handleChange('email', event.target.value)} />
              </label>
              <label className="form-control">
                <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/65">{labels.phone}</span>
                <input className="input input-bordered h-12 rounded-xl border-base-300 bg-base-100/90" value={formData.phone} onChange={(event) => handleChange('phone', event.target.value)} />
              </label>
              <label className="form-control">
                <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/65">{labels.username}</span>
                <input className="input input-bordered h-12 rounded-xl border-base-300 bg-base-100/90" required value={formData.username} onChange={(event) => handleChange('username', event.target.value)} />
              </label>
              <label className="form-control md:col-span-2">
                <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/65">{labels.password}</span>
                <input type="password" className="input input-bordered h-12 rounded-xl border-base-300 bg-base-100/90" required value={formData.password} onChange={(event) => handleChange('password', event.target.value)} />
              </label>
              <label className="label cursor-pointer md:col-span-2 justify-start gap-3 rounded-xl border border-base-300/80 bg-base-100 p-3">
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
            <div className="md:col-span-2 rounded-2xl border border-base-300/80 bg-base-100 p-4 text-sm">
              <p className="mb-4 text-base font-semibold">{labels.reviewTitle}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <p className="rounded-lg border border-base-300/70 bg-base-100/90 px-3 py-2"><span className="font-semibold">{labels.schoolName}:</span> {formData.schoolName}</p>
                <p className="rounded-lg border border-base-300/70 bg-base-100/90 px-3 py-2"><span className="font-semibold">{labels.schoolAddress}:</span> {formData.schoolAddress}</p>
                <p className="rounded-lg border border-base-300/70 bg-base-100/90 px-3 py-2"><span className="font-semibold">{labels.schoolPhone}:</span> {formData.schoolPhone}</p>
                <p className="rounded-lg border border-base-300/70 bg-base-100/90 px-3 py-2"><span className="font-semibold">{labels.name}:</span> {formData.name}</p>
                <p className="rounded-lg border border-base-300/70 bg-base-100/90 px-3 py-2"><span className="font-semibold">{labels.email}:</span> {formData.email}</p>
                <p className="rounded-lg border border-base-300/70 bg-base-100/90 px-3 py-2"><span className="font-semibold">{labels.phone}:</span> {formData.phone || '-'}</p>
                <p className="rounded-lg border border-base-300/70 bg-base-100/90 px-3 py-2"><span className="font-semibold">{labels.username}:</span> {formData.username}</p>
                <p className="rounded-lg border border-base-300/70 bg-base-100/90 px-3 py-2"><span className="font-semibold">{labels.instructor}:</span> {formData.wantsInstructorPrivileges ? labels.yes : labels.no}</p>
              </div>
            </div>
          ) : null}

          <div className="md:col-span-2 mt-2 flex flex-wrap items-center gap-2 border-t border-base-300/70 pt-3">
            {step > 1 ? (
              <button type="button" className="btn btn-outline rounded-xl px-5" onClick={() => setStep((prev) => Math.max(prev - 1, 1))}>
                {labels.back}
              </button>
            ) : null}
            {step < 3 ? (
              <button type="button" className="btn btn-primary rounded-xl px-6" onClick={goNext}>
                {labels.next}
              </button>
            ) : (
              <button type="submit" className="btn btn-primary rounded-xl px-6" disabled={isSubmitting}>
                {isSubmitting ? labels.submitting : labels.submit}
              </button>
            )}
          </div>
        </form>

        {success ? <div className="mt-4 rounded-xl border border-success/40 bg-success/10 px-4 py-3 text-success">{success}</div> : null}
        {error ? <div className="mt-4 rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-error">{error}</div> : null}
      </section>
    </main>
  )
}
