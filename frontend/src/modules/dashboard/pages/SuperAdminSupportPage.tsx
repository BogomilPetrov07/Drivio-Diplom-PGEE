import { useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import { ArrowLeft, MessageCircle, Send, Ticket, Trash2 } from 'lucide-react'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import type { Language } from '../../../i18n/language'
import {
  closeAdminSupportThread,
  deleteAdminSupportThread,
  fetchSupportThreadMessagesForAdmin,
  fetchSupportThreadsForAdmin,
  sendAdminSupportReply,
  type SupportMessage,
  type SupportThread,
} from '../api'

interface Props { language: Language }

export default function SuperAdminSupportPage({ language }: Props) {
  const support = getDashboardTranslations(language).support
  const [threads, setThreads] = useState<SupportThread[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list')
  const [isThreadsLoading, setIsThreadsLoading] = useState(true)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const [supportError, setSupportError] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [isReplySending, setIsReplySending] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const selectedThread = useMemo(() => threads.find((thread) => thread.id === selectedThreadId) ?? null, [threads, selectedThreadId])

  const loadThreads = async (silent = false) => {
    if (!silent) {
      setIsThreadsLoading(true)
      setSupportError('')
    }
    try {
      const loaded = await fetchSupportThreadsForAdmin()
      setThreads((prev) => (JSON.stringify(prev) === JSON.stringify(loaded) ? prev : loaded))
      setSelectedThreadId((current) => current ?? loaded[0]?.id ?? null)
    } catch {
      setSupportError(support.loadError)
    } finally {
      if (!silent) setIsThreadsLoading(false)
    }
  }

  const loadMessages = async (threadId: string, silent = false) => {
    if (!silent) {
      setIsMessagesLoading(true)
      setSupportError('')
    }
    try {
      const data = await fetchSupportThreadMessagesForAdmin(threadId)
      setMessages((prev) => (JSON.stringify(prev) === JSON.stringify(data.messages) ? prev : data.messages))
    } catch {
      setSupportError(support.messagesError)
    } finally {
      if (!silent) setIsMessagesLoading(false)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadThreads(true)
      if (selectedThreadId) void loadMessages(selectedThreadId, true)
    }, 6000)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId])

  const handleReply = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedThreadId || !replyBody.trim()) return
    setIsReplySending(true)
    setSupportError('')
    try {
      await sendAdminSupportReply(selectedThreadId, replyBody.trim())
      setReplyBody('')
      await loadMessages(selectedThreadId)
      await loadThreads()
    } catch {
      setSupportError(support.replyError)
    } finally {
      setIsReplySending(false)
    }
  }

  const handleClose = async (threadId?: string) => {
    const targetThreadId = threadId ?? selectedThreadId
    if (!targetThreadId) return
    setIsClosing(true)
    setSupportError('')
    try {
      await closeAdminSupportThread(targetThreadId)
      await loadThreads()
      if (selectedThreadId === targetThreadId) await loadMessages(targetThreadId)
    } catch {
      setSupportError(support.closeError)
    } finally {
      setIsClosing(false)
    }
  }

  const handleDelete = async (threadId?: string) => {
    const targetThreadId = threadId ?? selectedThreadId
    const targetThread = threads.find((thread) => thread.id === targetThreadId)
    if (!targetThreadId || targetThread?.status !== 'CLOSED') return
    setIsDeleting(true)
    setSupportError('')
    try {
      await deleteAdminSupportThread(targetThreadId)
      if (selectedThreadId === targetThreadId) {
        setSelectedThreadId(null)
        setMessages([])
      }
      await loadThreads()
    } catch {
      setSupportError(support.deleteError)
    } finally {
      setIsDeleting(false)
    }
  }

  const statusBadgeClass = (status: SupportThread['status']) => (status === 'CLOSED' ? 'badge-warning' : 'badge-success')
  const statusLabel = (status: SupportThread['status']) => (status === 'CLOSED' ? (language === 'bg' ? 'Затворен' : 'Closed') : (language === 'bg' ? 'Отворен' : 'Open'))
  const ticketTitle = (thread: SupportThread) => {
    const firstLine = (thread.ticketSubject ?? '').split('\n')[0]?.trim()
    return firstLine && firstLine.length > 2 ? firstLine : `Ticket #${thread.id.slice(0, 8)}`
  }

  const shellCardClass = 'rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)]'
  const panelClass = 'rounded-2xl border border-base-300/70 bg-base-100/80 p-3 backdrop-blur-sm'
  const panelHeightClass = 'h-[calc(100dvh-12rem)] sm:h-[calc(100dvh-13rem)] lg:h-[56vh] lg:min-h-[520px] lg:max-h-[680px]'

  return (
    <section className={`${shellCardClass} p-3 sm:p-5`}>
      <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">{support.title}</h2>
      {supportError ? <p className="mb-3 mt-2 text-sm text-error">{supportError}</p> : null}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:mt-4 sm:gap-4 lg:grid-cols-5">
        <div className={`lg:col-span-2 ${panelHeightClass} ${panelClass} flex flex-col ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}`}>
          {isThreadsLoading ? (
            <div className="space-y-2 p-1">
              <div className="skeleton h-16 w-full rounded-xl" />
              <div className="skeleton h-16 w-full rounded-xl" />
              <div className="skeleton h-16 w-full rounded-xl" />
            </div>
          ) : null}
          {!isThreadsLoading && threads.length === 0 ? (
            <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-gradient-to-b from-base-200/60 to-base-100 px-4 text-center">
              <div className="mb-3 rounded-full bg-base-300 p-3"><Ticket className="h-5 w-5 text-base-content/70" /></div>
              <p className="text-sm font-medium text-base-content">{support.empty}</p>
              <p className="mt-1 text-xs text-base-content/60">{support.emptyHint}</p>
            </div>
          ) : null}
          <div className="mt-1 flex-1 space-y-2 overflow-y-auto pr-1">
            {threads.map((thread) => (
              <div key={thread.id} className={`w-full rounded-xl border p-3 transition-all ${selectedThreadId === thread.id ? 'border-primary/80 bg-primary/12' : 'border-base-300 bg-base-100 hover:bg-base-200'}`}>
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedThreadId(thread.id)
                      setMobileView('chat')
                    }}
                    className="flex-1 text-left"
                  >
                    <p className="text-base font-semibold text-base-content sm:text-lg">{ticketTitle(thread)}</p>
                    <p className="text-sm text-base-content/65">{thread.requesterName}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-base-content/70">{thread.latestMessagePreview || support.noPreview}</p>
                    <div className="mt-2"><span className={`badge badge-xs ${statusBadgeClass(thread.status)}`}>{statusLabel(thread.status)}</span></div>
                  </button>
                  <div className="flex shrink-0 flex-col gap-2 pt-0.5">
                    <button
                      type="button"
                      className={`btn btn-xs w-[96px] ${thread.status === 'CLOSED' ? 'btn-success' : 'btn-warning'}`}
                      onClick={() => void handleClose(thread.id)}
                      disabled={isClosing || (thread.status === 'CLOSED' && !thread.canReopen)}
                    >
                      {thread.status === 'CLOSED' ? 'Open ticket' : 'Close ticket'}
                    </button>
                    {thread.status === 'CLOSED' ? (
                      <button type="button" className="btn btn-error btn-xs w-[96px] gap-1" onClick={() => void handleDelete(thread.id)} disabled={isDeleting}>
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`lg:col-span-3 ${panelHeightClass} ${panelClass} flex flex-col ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}`}>
          {!selectedThread ? (
            <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-gradient-to-b from-base-200/60 to-base-100 px-4 text-center">
              <div className="mb-3 rounded-full bg-base-300 p-3"><MessageCircle className="h-5 w-5 text-base-content/70" /></div>
              <p className="text-sm font-semibold text-base-content">{support.selectThread}</p>
              <p className="mt-1 text-xs text-base-content/60">{support.selectHint}</p>
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

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {isMessagesLoading ? (
                  <div className="space-y-2">
                    <div className="skeleton h-14 w-2/3 rounded-2xl" />
                    <div className="skeleton ml-auto h-14 w-2/3 rounded-2xl" />
                    <div className="skeleton h-14 w-2/3 rounded-2xl" />
                  </div>
                ) : null}
                {!isMessagesLoading && messages.length === 0 ? <p className="text-sm text-base-content/70">{support.noMessages}</p> : null}
                {messages.map((message) => {
                  const isMine = message.senderType === 'SUPERADMIN'
                  return (
                    <article key={message.id} className={`max-w-[88%] rounded-2xl border px-3 py-2 ${isMine ? 'ml-auto border-primary/30 bg-primary/10' : 'border-base-300 bg-base-100'}`}>
                      <p className="text-xs text-base-content/60">{message.senderName} · {message.via}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-base-content">{message.body}</p>
                    </article>
                  )
                })}
              </div>

              {selectedThread.source === 'PUBLIC' ? (
                selectedThread.status !== 'CLOSED' ? (
                  <a href={`mailto:${selectedThread.requesterEmail}?subject=${encodeURIComponent(`Re: Support ticket ${selectedThread.id}`)}&cc=${encodeURIComponent('support@mail.drivio-bg.com')}`} className="btn btn-outline btn-sm mt-3 w-fit shrink-0">
                    {support.writeBackEmail}
                  </a>
                ) : null
              ) : selectedThread.status !== 'CLOSED' ? (
                <form className="mt-3 shrink-0" onSubmit={(event) => void handleReply(event)}>
                  <div className="flex items-center gap-2 rounded-full border border-base-300 bg-base-100 px-2 py-1.5">
                    <input className="h-10 w-full bg-transparent px-3 text-sm text-base-content outline-none placeholder:text-base-content/50" value={replyBody} onChange={(event) => setReplyBody(event.target.value)} placeholder={support.replyPlaceholder} required />
                    <button type="submit" className="btn btn-primary btn-circle btn-sm" disabled={isReplySending}><Send className="h-4 w-4" /></button>
                  </div>
                </form>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </section>
  )
}

