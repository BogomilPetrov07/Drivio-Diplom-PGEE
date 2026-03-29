import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/hooks.js'
import api from '../../../services/api.js'

interface DashboardShellProps {
  title: string
  subtitle: string
  items: string[]
}

export default function DashboardShell({ title, subtitle, items }: DashboardShellProps) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [isTestingHello, setIsTestingHello] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // Ignore network/logout response errors and still navigate away.
    }
    navigate('/login', { replace: true })
  }

  const handleTestHello = async () => {
    setIsTestingHello(true)
    try {
      const response = await api.get<{ message: string }>('/auth/hello')
      window.alert(response.data.message)
    } catch {
      window.alert('Protected Hello test failed. Check session status.')
    } finally {
      setIsTestingHello(false)
    }
  }

  return (
    <main className="min-h-screen bg-base-200 px-4 py-10">
      <section className="mx-auto w-full max-w-4xl rounded-2xl border border-base-300 bg-base-100 p-6 shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-base-content/60">Signed in as {user?.username}</p>
            <h1 className="text-3xl font-bold text-base-content">{title}</h1>
            <p className="mt-1 text-base-content/70">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-outline" disabled={isTestingHello} onClick={() => void handleTestHello()}>
              {isTestingHello ? 'Testing...' : 'Test Hello'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => void handleLogout()}>
              Sign out
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <article key={item} className="rounded-xl border border-base-300 bg-base-200 p-4">
              <p className="text-sm text-base-content/80">{item}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
