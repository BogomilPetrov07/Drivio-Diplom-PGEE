import { type SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, LifeBuoy, Plus, Send, Ticket } from 'lucide-react'
import {
  fetchUserSupportThreadMessages,
  fetchUserSupportThreads,
  replyToUserSupportThread,
  submitDashboardSupportQuestion,
  type SupportMessage,
  type SupportThread,
} from '../api'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import type { Language } from '../../../i18n/language'

interface SupportContactCardProps {
  language: Language
}

function areEqual<T>(a: T, b: T) {
  return JSON.stringify(a) === JSON.stringify(b)
}

export default function SupportContactCard({ language }: SupportContactCardProps) {
  const t = getDashboardTranslations(language).supportUser
  const [mode, setMode] = useState<'list' | 'create'>('list')
  const [question, setQuestion] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [threads, setThreads] = useState<SupportThread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [replyBody, setReplyBody] = useState('')
  const [isReplySending, setIsReplySending] = useState(false)
  const notifiedRef = useRef<Record<string, string>>({})

  const selectedThread = useMemo(() => threads.find((thread) => thread.id === selectedThreadId) ?? null, [threads, selectedThreadId])

  const getTicketTitle = (thread: SupportThread) => {
    const firstLine = (thread.ticketSubject ?? '').split('\n')[0]?.trim()
    return firstLine && firstLine.length > 2 ? firstLine : `Ticket #${thread.id.slice(0, 8)}`
  }

  const loadThreads = async () => {
    try {
      const loaded = await fetchUserSupportThreads()
      loaded.forEach((thread) => {
        if (!thread.latestMessageAt || thread.latestSenderType !== 'SUPERADMIN') return
        const alreadyNotifiedAt = notifiedRef.current[thread.id]
        if (alreadyNotifiedAt === thread.latestMessageAt) return
        if (thread.id === selectedThreadId) return

        notifiedRef.current[thread.id] = thread.latestMessageAt
        window.dispatchEvent(
          new CustomEvent('drivio:support-notification', {
            detail: {
              title: language === 'bg' ? 'Нов отговор от поддръжката' : 'New support reply',
              body: getTicketTitle(thread),
            },
          }),
        )
      })

      setThreads((prev) => (areEqual(prev, loaded) ? prev : loaded))
      setSelectedThreadId((prev) => {
        if (!loaded.length) return null
        if (prev && loaded.some((thread) => thread.id === prev)) return prev
        return loaded[0].id
      })
    } catch {
      setError(t.loadError)
    }
  }

  const loadMessages = async (threadId: string) => {
    try {
      const data = await fetchUserSupportThreadMessages(threadId)
      setMessages((prev) => (areEqual(prev, data.messages) ? prev : data.messages))
    } catch {
      setError(t.messagesError)
    }
  }

  useEffect(() => {
    void loadThreads()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([])
      setMobileView('list')
      return
    }
    void loadMessages(selectedThreadId)
    const current = threads.find((thread) => thread.id === selectedThreadId)
    if (current?.latestMessageAt) {
      notifiedRef.current[selectedThreadId] = current.latestMessageAt
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadThreads()
      if (selectedThreadId) void loadMessages(selectedThreadId)
    }, 8000)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId])

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setIsSubmitting(true)
    try {
      const response = await submitDashboardSupportQuestion(question.trim())
      setSuccess(t.success)
      setQuestion('')
      setMode('list')
      await loadThreads()
      if (response.threadId) setSelectedThreadId(response.threadId)
    } catch {
      setError(t.error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReply = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedThreadId || !replyBody.trim() || selectedThread?.status === 'CLOSED') return
    setIsReplySending(true)
    setError('')
    try {
      await replyToUserSupportThread(selectedThreadId, replyBody)
      setReplyBody('')
      await loadMessages(selectedThreadId)
      await loadThreads()
    } catch {
      setError(t.error)
    } finally {
      setIsReplySending(false)
    }
  }

  const statusLabel = (status: SupportThread['status']) => (status === 'CLOSED' ? t.closed : t.open)

  const statusBadgeClass = (status: SupportThread['status']) => {
    if (status === 'CLOSED') return 'badge-warning'
    return 'badge-success'
  }

  const shellCardClass = 'rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)]'
  const panelClass = 'rounded-2xl border border-base-300/70 bg-base-100/80 p-3 backdrop-blur-sm'
  const panelHeightClass = 'h-[calc(100dvh-12rem)] sm:h-[calc(100dvh-13rem)] lg:h-[56vh] lg:min-h-[520px] lg:max-h-[680px]'

  return (
    <section className={`${shellCardClass} p-3 sm:p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-3xl">{t.title}</h2>
        </div>
        <button type="button" className="btn btn-accent btn-sm gap-2" onClick={() => setMode(mode === 'create' ? 'list' : 'create')}>
          <Plus className="h-4 w-4" />
          {t.newTicket}
        </button>
      </div>

      {success ? <p className="mt-3 text-xs text-success">{success}</p> : null}
      {error ? <p className="mt-3 text-xs text-error">{error}</p> : null}

      {mode === 'create' ? (
        <form className="mt-3 rounded-2xl border border-base-300/70 bg-base-100/80 p-3 shadow-inner sm:mt-4 sm:p-4" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid grid-cols-1 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-base-content/80">{t.questionLabel}</span>
              <textarea className="textarea textarea-bordered w-full min-h-24" value={question} placeholder={t.questionPlaceholder} onChange={(event) => setQuestion(event.target.value)} required />
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button type="submit" className="btn btn-primary btn-sm gap-2" disabled={isSubmitting}>
              <Send className="h-4 w-4" />
              {isSubmitting ? t.submitting : t.submit}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setMode('list')
                setQuestion('')
                setError('')
              }}
            >
              {language === 'bg' ? 'Отказ' : 'Cancel'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-3 rounded-2xl border border-base-300/70 bg-base-200/60 p-2.5 sm:mt-4 sm:p-3">
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3 lg:grid-cols-5">
          <aside className={`lg:col-span-2 ${panelHeightClass} ${panelClass} ${mobileView === 'chat' ? 'hidden lg:block' : 'block'}`}>
            {threads.length === 0 ? (
              <div className="mx-2 flex h-[320px] sm:h-[380px] lg:h-[520px] flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-gradient-to-b from-base-200/60 to-base-100 px-4 text-center">
                <div className="mb-3 rounded-full bg-base-300 p-3"><Ticket className="h-5 w-5 text-base-content/70" /></div>
                <p className="text-sm font-medium text-base-content">{t.noThreads}</p>
                <p className="mt-1 text-xs text-base-content/60">{t.emptyHint}</p>
              </div>
            ) : null}
            <div className="h-full space-y-2 overflow-auto pr-1">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => {
                    setSelectedThreadId(thread.id)
                    setMobileView('chat')
                  }}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition-all ${
                    selectedThreadId === thread.id
                      ? 'border-primary/80 bg-primary/12 shadow-[0_8px_22px_-20px_rgba(99,102,241,0.9)]'
                      : 'border-base-300 bg-base-100 hover:-translate-y-[1px] hover:bg-base-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="line-clamp-1 text-xs font-semibold text-base-content">{getTicketTitle(thread)}</p>
                    <span className={`badge badge-xs ${statusBadgeClass(thread.status)}`}>{statusLabel(thread.status)}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs text-base-content/65">{thread.latestMessagePreview || t.noMessages}</p>
                </button>
              ))}
            </div>
          </aside>

          <div className={`lg:col-span-3 ${panelHeightClass} ${panelClass} flex flex-col ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}`}>
            {!selectedThread ? (
              <div className="flex h-[380px] sm:h-[460px] lg:h-[520px] flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-gradient-to-b from-base-200/60 to-base-100 px-4 text-center">
                <div className="mb-3 rounded-full bg-base-300 p-3"><LifeBuoy className="h-5 w-5 text-base-content/70" /></div>
                <p className="text-sm font-semibold text-base-content">{t.conversation}</p>
                <p className="mt-1 text-xs text-base-content/60">{t.selectHint}</p>
              </div>
            ) : null}
            {selectedThread ? (
              <>
                <div className="mb-2 lg:hidden">
                  <button type="button" className="btn btn-ghost btn-xs gap-1" onClick={() => setMobileView('list')}>
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {language === 'bg' ? 'Назад' : 'Back'}
                  </button>
                </div>
                <div className="min-h-0 flex-1 space-y-2 overflow-auto pr-1">
                  {messages.length === 0 ? <p className="text-xs text-base-content/70">{t.noMessages}</p> : null}
                  {messages.map((message) => (
                    <article
                      key={message.id}
                      className={`max-w-[88%] rounded-2xl border px-3 py-2 ${
                        message.senderType === 'USER' ? 'ml-auto border-primary/30 bg-primary/10' : 'border-base-300 bg-base-200'
                      }`}
                    >
                      <p className="text-[11px] text-base-content/55">{message.senderName}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-base-content">{message.body}</p>
                    </article>
                  ))}
                </div>

                <form className="mt-3" onSubmit={(event) => void handleReply(event)}>
                  <div className="flex items-center gap-2 rounded-full border border-base-300 bg-base-200 px-2 py-1.5">
                    <input
                      className="h-10 w-full bg-transparent px-3 text-sm text-base-content outline-none placeholder:text-base-content/50"
                      value={replyBody}
                      placeholder={t.replyPlaceholder}
                      onChange={(event) => setReplyBody(event.target.value)}
                      disabled={selectedThread.status === 'CLOSED'}
                      required
                    />
                    <button type="submit" className="btn btn-primary btn-circle btn-sm" disabled={isReplySending || selectedThread.status === 'CLOSED'}>
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
