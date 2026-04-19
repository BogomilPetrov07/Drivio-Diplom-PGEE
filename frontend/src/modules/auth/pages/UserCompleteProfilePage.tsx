import { type SyntheticEvent, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Language } from '../../../i18n/language'
import api from '../../../services/api'

interface Props {
  language: Language
}

type SetupSessionResponse = {
  status: 'SUCCESS'
  user: {
    id: string
    name: string
    email: string
    role: string
    schoolName: string
  }
  token: {
    expiresAt: string
    usedCount: number
    remainingUses: number
    maxUses: number
  }
}

export default function UserCompleteProfilePage({ language }: Props) {
  const isBg = language === 'bg'
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [session, setSession] = useState<SetupSessionResponse | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setError(isBg ? 'Липсва токен за настройка.' : 'Setup token is missing.')
        setLoading(false)
        return
      }

      try {
        const { data } = await api.get<SetupSessionResponse>('/onboarding/user-profile/setup-session', { params: { token } })
        setSession(data)
        setForm((prev) => ({
          ...prev,
          name: data.user.name ?? '',
          email: data.user.email ?? '',
        }))
      } catch {
        setError(isBg ? 'Линкът е невалиден или изтекъл.' : 'The link is invalid or expired.')
      } finally {
        setLoading(false)
      }
    }

    void run()
  }, [isBg, token])

  const onSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')

    if (form.password !== form.confirmPassword) {
      setError(isBg ? 'Паролите не съвпадат.' : 'Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/onboarding/user-profile/complete', {
        token,
        name: form.name.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
      })
      setSuccess(isBg ? 'Профилът е завършен успешно. Вече може да влезете.' : 'Profile completed successfully. You can now sign in.')
    } catch (submitError: unknown) {
      const message =
        submitError && typeof submitError === 'object' && 'response' in submitError
          ? (submitError as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setError(message ?? (isBg ? 'Неуспешно завършване на профила.' : 'Could not complete profile.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <main className="min-h-screen bg-base-200" />
  }

  return (
    <main className="min-h-screen bg-base-200 px-4 py-20">
      <section className="mx-auto w-full max-w-2xl rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xl">
        <h1 className="text-2xl font-semibold text-base-content">{isBg ? 'Завършване на профил' : 'Complete profile'}</h1>
        <p className="mt-2 text-sm text-base-content/70">
          {isBg ? 'Активирайте профила си в Drivio.' : 'Activate your Drivio account.'}
        </p>

        {session ? (
          <div className="mt-4 rounded-xl border border-base-300 bg-base-100/80 p-3 text-sm text-base-content/80">
            <p><span className="font-semibold">{isBg ? 'Школа:' : 'School:'}</span> {session.user.schoolName || '-'}</p>
            <p><span className="font-semibold">{isBg ? 'Остават опити:' : 'Attempts left:'}</span> {session.token.remainingUses}/{session.token.maxUses}</p>
            <p><span className="font-semibold">{isBg ? 'Валидно до:' : 'Valid until:'}</span> {new Date(session.token.expiresAt).toLocaleString()}</p>
          </div>
        ) : null}

        <form className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={(event) => void onSubmit(event)}>
          <label className="form-control">
            <span className="label-text">{isBg ? 'Име' : 'Name'}</span>
            <input className="input input-bordered" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
          </label>
          <label className="form-control">
            <span className="label-text">{isBg ? 'Имейл' : 'Email'}</span>
            <input type="email" className="input input-bordered" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required />
          </label>
          <label className="form-control md:col-span-2">
            <span className="label-text">{isBg ? 'Потребителско име' : 'Username'}</span>
            <input className="input input-bordered" value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} required />
          </label>
          <label className="form-control">
            <span className="label-text">{isBg ? 'Парола' : 'Password'}</span>
            <input type="password" className="input input-bordered" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} required />
          </label>
          <label className="form-control">
            <span className="label-text">{isBg ? 'Потвърди парола' : 'Confirm password'}</span>
            <input type="password" className="input input-bordered" value={form.confirmPassword} onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))} required />
          </label>
          <div className="md:col-span-2">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (isBg ? 'Записване...' : 'Saving...') : (isBg ? 'Завърши профила' : 'Complete profile')}
            </button>
          </div>
        </form>

        {success ? <p className="mt-4 text-success">{success}</p> : null}
        {error ? <p className="mt-4 text-error">{error}</p> : null}
      </section>
    </main>
  )
}
