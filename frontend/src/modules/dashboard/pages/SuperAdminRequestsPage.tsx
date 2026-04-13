import { useEffect, useState } from 'react'
import { ClipboardX } from 'lucide-react'
import { approveSchoolJoinRequest, fetchPendingSchoolJoinRequests, type SchoolJoinRequest } from '../api'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import type { Language } from '../../../i18n/language'

interface Props { language: Language }

export default function SuperAdminRequestsPage({ language }: Props) {
  const onboarding = getDashboardTranslations(language).onboarding
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

  useEffect(() => { void loadRequests() }, [])

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
    <section className="rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-3 sm:p-5 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold tracking-tight text-base-content">{onboarding.title}</h2>
      </div>

      {actionError ? <p className="mb-3 text-sm text-error">{actionError}</p> : null}

      {isLoading ? (
        <div className="space-y-2">
          <div className="skeleton h-11 w-full rounded-xl" />
          <div className="skeleton h-14 w-full rounded-xl" />
          <div className="skeleton h-14 w-full rounded-xl" />
          <div className="skeleton h-14 w-full rounded-xl" />
        </div>
      ) : null}

      {!isLoading && requests.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100/70 px-4 text-center">
          <div className="mb-3 rounded-full bg-base-200 p-3"><ClipboardX className="h-5 w-5 text-base-content/70" /></div>
          <p className="text-sm font-semibold text-base-content">{onboarding.empty}</p>
          <p className="mt-1 text-xs text-base-content/60">{language === 'bg' ? 'Няма нови заявки за преглед.' : 'There are no new join requests to review.'}</p>
        </div>
      ) : null}

      {!isLoading && requests.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100/80">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>{language === 'bg' ? 'Школа' : 'School'}</th>
                <th>{language === 'bg' ? 'Адрес' : 'Address'}</th>
                <th>{language === 'bg' ? 'Телефон' : 'Phone'}</th>
                <th>{onboarding.contact}</th>
                <th className="text-right">{language === 'bg' ? 'Действие' : 'Action'}</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td className="font-medium">{request.schoolName}</td>
                  <td>{request.schoolAddress}</td>
                  <td>{request.schoolPhone}</td>
                  <td>{request.contactName} ({request.contactEmail})</td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => void handleApprove(request.id)}
                      disabled={approvingRequestId === request.id}
                    >
                      {approvingRequestId === request.id ? onboarding.approving : onboarding.approve}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
