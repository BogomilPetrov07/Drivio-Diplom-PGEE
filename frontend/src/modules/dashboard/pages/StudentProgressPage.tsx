import { useEffect, useState } from 'react'
import { Award, BookOpenCheck, Clock3, Star } from 'lucide-react'
import type { Language } from '../../../i18n/language'
import { fetchStudentProgress, type StudentProgressSummary } from '../api'

interface Props { language: Language }

export default function StudentProgressPage({ language }: Props) {
  const isBg = language === 'bg'
  const [progress, setProgress] = useState<StudentProgressSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchStudentProgress()
        if (!active) return
        setProgress(data)
      } catch {
        if (!active) return
        setError(isBg ? 'Не успяхме да заредим прогреса.' : 'Could not load progress.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [isBg])

  const locale = isBg ? 'bg-BG' : 'en-US'

  return (
    <section className="space-y-4 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-4 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)] sm:p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
          {isBg ? 'Прогрес' : 'Progress'}
        </h2>
        <p className="mt-1 text-sm text-base-content/70">
          {isBg ? 'Следете завършените часове и напредъка към практическата цел.' : 'Track completed lessons and your progress toward the practical goal.'}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-base-300 bg-base-100/90 p-4">
              <div className="skeleton h-4 w-24 rounded-md" />
              <div className="mt-3 skeleton h-8 w-16 rounded-md" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-error/35 bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      ) : progress ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-base-content/75">
                <BookOpenCheck className="h-4 w-4 text-primary" />
                <span>{isBg ? 'Завършени часове' : 'Completed hours'}</span>
              </div>
              <p className="mt-2 text-3xl font-semibold text-base-content">{progress.completedHours}</p>
              <p className="mt-1 text-sm text-base-content/65">
                {isBg ? `От ${progress.requiredHours} необходими часа` : `Out of ${progress.requiredHours} required hours`}
              </p>
            </article>

            <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-base-content/75">
                <Clock3 className="h-4 w-4 text-primary" />
                <span>{isBg ? 'Оставащи часове' : 'Remaining hours'}</span>
              </div>
              <p className="mt-2 text-3xl font-semibold text-base-content">{progress.remainingHours}</p>
              <p className="mt-1 text-sm text-base-content/65">
                {isBg ? 'До покриване на практическата норма' : 'Until the practical requirement is complete'}
              </p>
            </article>

            <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-base-content/75">
                <Award className="h-4 w-4 text-primary" />
                <span>{isBg ? 'Общ напредък' : 'Overall progress'}</span>
              </div>
              <p className="mt-2 text-3xl font-semibold text-base-content">{progress.completionPercent}%</p>
              <progress className="progress progress-primary mt-3 h-2.5 w-full" value={progress.completionPercent} max={100} />
            </article>
          </div>

          <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
            <h3 className="text-base font-semibold text-base-content">
              {isBg ? 'Последни завършени уроци' : 'Recent completed lessons'}
            </h3>

            {progress.completedLessons.length === 0 ? (
              <p className="mt-3 text-sm text-base-content/65">
                {isBg ? 'Все още няма записани завършени практически часове.' : 'No completed practical lessons are recorded yet.'}
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {progress.completedLessons.map((lesson) => (
                  <div key={lesson.id} className="rounded-xl border border-base-300/75 bg-base-100 px-4 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-base-content">
                          {new Date(lesson.startTime).toLocaleString(locale, {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <p className="mt-1 text-xs text-base-content/65">
                          {isBg ? 'Завършен на' : 'Completed on'} {new Date(lesson.completedAt).toLocaleString(locale)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-base-content/75">
                        <span>
                          {new Date(lesson.startTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                          {' - '}
                          {new Date(lesson.endTime).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {typeof lesson.rating === 'number' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-base-300 px-2 py-1 text-xs">
                            <Star className="h-3.5 w-3.5 text-warning" />
                            {lesson.rating}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {lesson.notes ? (
                      <p className="mt-2 text-sm text-base-content/70">{lesson.notes}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </article>
        </>
      ) : null}
    </section>
  )
}
