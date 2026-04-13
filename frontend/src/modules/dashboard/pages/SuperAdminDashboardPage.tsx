import { useEffect, useState } from 'react'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import type { Language } from '../../../i18n/language'
import { approveSchoolJoinRequest, fetchPendingSchoolJoinRequests, type SchoolJoinRequest } from '../api'
import DashboardShell from '../components/DashboardShell.js'

interface SuperAdminDashboardPageProps {
  language: Language
  setLanguage: (language: Language) => void
  themePreference: 'system' | 'light' | 'dark'
  resolvedTheme: 'drivio-light' | 'drivio-dark'
  setThemePreference: (theme: 'system' | 'light' | 'dark') => void
}

export default function SuperAdminDashboardPage({
  language,
  setLanguage,
  themePreference,
  resolvedTheme,
  setThemePreference,
}: SuperAdminDashboardPageProps) {
  const dashboardT = getDashboardTranslations(language)
  const t = dashboardT.roles.superadmin
  const onboarding = dashboardT.onboarding
  const [requests, setRequests] = useState<SchoolJoinRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null)

  const loadRequests = async () => {
    setIsLoading(true)
    setActionError('')
    try {
      const pending = await fetchPendingSchoolJoinRequests()
      setRequests(pending)
    } catch {
      setActionError(onboarding.loadError)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApprove = async (requestId: string) => {
    setApprovingRequestId(requestId)
    setActionError('')
    try {
      await approveSchoolJoinRequest(requestId)
      await loadRequests()
    } catch {
      setActionError(onboarding.approveError)
    } finally {
      setApprovingRequestId(null)
    }
  }

  return (
    <DashboardShell
      language={language}
      setLanguage={setLanguage}
      themePreference={themePreference}
      resolvedTheme={resolvedTheme}
      setThemePreference={setThemePreference}
      title={t.title}
      subtitle={t.subtitle}
      items={t.items}
    >
      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-base-content">{onboarding.title}</h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => void loadRequests()} disabled={isLoading}>
            {onboarding.refresh}
          </button>
        </div>

        {isLoading ? <p className="text-base-content/70">{onboarding.loading}</p> : null}
        {actionError ? <p className="mb-3 text-sm text-error">{actionError}</p> : null}
        {!isLoading && requests.length === 0 ? <p className="text-base-content/70">{onboarding.empty}</p> : null}

        <div className="space-y-3">
          {requests.map((request) => (
            <article key={request.id} className="rounded-xl border border-base-300 bg-base-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-base-content">{request.schoolName}</h3>
                  <p className="text-sm text-base-content/70">{request.schoolAddress}</p>
                  <p className="text-sm text-base-content/70">{request.schoolPhone}</p>
                  <p className="mt-2 text-sm text-base-content">
                    {onboarding.contact}: {request.contactName} ({request.contactEmail})
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => void handleApprove(request.id)}
                  disabled={approvingRequestId === request.id}
                >
                  {approvingRequestId === request.id ? onboarding.approving : onboarding.approve}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </DashboardShell>
  )
}
