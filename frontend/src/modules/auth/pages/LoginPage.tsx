import { Link } from 'react-router-dom'
import type { Language } from '../../../i18n/public/index.js'

interface LoginPageProps {
  language: Language
}

export default function LoginPage({ language }: LoginPageProps) {
  const text = language === 'bg'
    ? {
        title: 'Вход в Drivio',
        subtitle: 'Влезте с вашия профил, за да продължите',
        userLabel: 'Потребителско име или имейл',
        userPlaceholder: 'name@example.com',
        passLabel: 'Парола',
        passPlaceholder: '••••••••',
        submit: 'Вход',
        back: 'Назад към началната страница',
      }
    : {
        title: 'Sign in to Drivio',
        subtitle: 'Use your account credentials to continue',
        userLabel: 'Username or email',
        userPlaceholder: 'name@example.com',
        passLabel: 'Password',
        passPlaceholder: '••••••••',
        submit: 'Sign in',
        back: 'Back to landing page',
      }

  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md card bg-base-100 shadow-xl border border-base-300">
        <div className="card-body">
          <h1 className="text-heading text-base-content">{text.title}</h1>
          <p className="text-helper text-base-content/70 mb-3">{text.subtitle}</p>

          <form className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text text-body">{text.userLabel}</span>
              </label>
              <input type="text" className="input input-bordered w-full" placeholder={text.userPlaceholder} autoComplete="username" />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text text-body">{text.passLabel}</span>
              </label>
              <input type="password" className="input input-bordered w-full" placeholder={text.passPlaceholder} autoComplete="current-password" />
            </div>

            <button type="submit" className="btn btn-primary w-full">
              {text.submit}
            </button>
          </form>

          <Link to="/" className="text-helper text-center text-base-content/70 hover:text-primary mt-2">
            {text.back}
          </Link>
        </div>
      </div>
    </main>
  )
}
