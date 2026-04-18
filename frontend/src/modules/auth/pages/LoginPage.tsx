import { type SyntheticEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAuthTranslations } from '../../../i18n/auth'
import type { Language } from '../../../i18n/language'
import { getDomainAwareUrl } from '../../../utils/app-domain'
import { useAuth } from '../hooks.js'
import { getRoleDashboardPath } from '../types.js'
import SessionLoadingScreen from '../components/SessionLoadingScreen'

interface LoginPageProps {
  language: Language
}

export default function LoginPage({ language }: LoginPageProps) {
  const navigate = useNavigate()
  const { login, loading, error, clearError, role, isAuthenticated } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoginAttempt, setIsLoginAttempt] = useState(false)
  const [loginAnimationDoneAt, setLoginAnimationDoneAt] = useState<number | null>(null)
  const text = getAuthTranslations(language).login
  const backHref = getDomainAwareUrl('/')

  useEffect(() => {
    if (!isAuthenticated || !role) return
    if (!isLoginAttempt || !loginAnimationDoneAt) {
      navigate(getRoleDashboardPath(role), { replace: true })
      return
    }

    const waitMs = Math.max(0, loginAnimationDoneAt - Date.now())
    if (waitMs === 0) {
      navigate(getRoleDashboardPath(role), { replace: true })
      return
    }

    const timer = window.setTimeout(() => {
      navigate(getRoleDashboardPath(role), { replace: true })
    }, waitMs)

    return () => window.clearTimeout(timer)
  }, [isAuthenticated, role, navigate, isLoginAttempt, loginAnimationDoneAt])

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()
    setIsLoginAttempt(true)
    setLoginAnimationDoneAt(Date.now() + 5000)
    try {
      await login({ username, password })
    } catch {
      // Error state is already handled in the auth store.
      setIsLoginAttempt(false)
      setLoginAnimationDoneAt(null)
    }
  }

  if (loading && isLoginAttempt) {
    return <SessionLoadingScreen language={language} simulateProgress />
  }

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h1 className="text-heading text-base-content">{text.title}</h1>
          <p className="text-helper text-base-content/70 mb-3">{text.subtitle}</p>

          <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-body">{text.userLabel}</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder={text.userPlaceholder}
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-body">{text.passLabel}</span>
              </label>
              <input
                type="password"
                className="input input-bordered w-full"
                placeholder={text.passPlaceholder}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-error" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? '...' : text.submit}
            </button>
          </form>

          <a href={backHref} className="text-helper text-center text-base-content/70 hover:text-primary mt-2">
            {text.back}
          </a>
        </div>
      </div>
    </main>
  )
}


