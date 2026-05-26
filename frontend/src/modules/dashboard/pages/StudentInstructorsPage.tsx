import { useEffect, useState } from 'react'
import { GraduationCap, Mail, MapPin, Phone, School } from 'lucide-react'
import type { Language } from '../../../i18n/language'
import { fetchStudentInstructors, type StudentInstructorSummary } from '../api'

interface Props { language: Language }

export default function StudentInstructorsPage({ language }: Props) {
  const isBg = language === 'bg'
  const [summary, setSummary] = useState<StudentInstructorSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await fetchStudentInstructors()
        if (!active) return
        setSummary(data)
      } catch {
        if (!active) return
        setError(isBg ? 'Не успяхме да заредим информацията за инструктор.' : 'Could not load instructor information.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [isBg])

  return (
    <section className="space-y-4 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-4 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)] sm:p-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
          {isBg ? 'Инструктори' : 'Instructors'}
        </h2>
        <p className="mt-1 text-sm text-base-content/70">
          {isBg ? 'Вижте назначения инструктор и основната информация за автошколата.' : 'View your assigned instructor and the main school details.'}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-xl border border-base-300 bg-base-100/90 p-4">
              <div className="skeleton h-4 w-24 rounded-md" />
              <div className="mt-3 skeleton h-8 w-32 rounded-md" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-error/35 bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      ) : summary ? (
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-base-content/75">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span>{isBg ? 'Назначен инструктор' : 'Assigned instructor'}</span>
            </div>

            {summary.instructor ? (
              <div className="mt-4 space-y-2">
                <p className="text-lg font-semibold text-base-content">
                  {summary.instructor.name || summary.instructor.username}
                </p>
                <p className="text-sm text-base-content/70">@{summary.instructor.username}</p>
                <div className="space-y-2 pt-1 text-sm text-base-content/75">
                  {summary.instructor.email ? (
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>{summary.instructor.email}</span>
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-base-content/65">
                {isBg ? 'Все още няма назначен инструктор.' : 'No instructor has been assigned yet.'}
              </p>
            )}
          </article>

          <article className="rounded-xl border border-base-300/80 bg-base-100/90 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-base-content/75">
              <School className="h-4 w-4 text-primary" />
              <span>{isBg ? 'Автошкола' : 'Driving school'}</span>
            </div>

            {summary.school ? (
              <div className="mt-4 space-y-2">
                <p className="text-lg font-semibold text-base-content">{summary.school.name}</p>
                <p className="flex items-center gap-2 text-sm text-base-content/75">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{summary.school.address}</span>
                </p>
                <p className="flex items-center gap-2 text-sm text-base-content/75">
                  <Phone className="h-4 w-4 text-primary" />
                  <span>{summary.school.phone}</span>
                </p>
                <p className="pt-2 text-sm text-base-content/70">
                  {isBg
                    ? `Завършени часове: ${summary.completedHours} от ${summary.requiredHours}`
                    : `Completed hours: ${summary.completedHours} of ${summary.requiredHours}`}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-base-content/65">
                {isBg ? 'Няма заредени данни за автошкола.' : 'No school data is available.'}
              </p>
            )}
          </article>
        </div>
      ) : null}
    </section>
  )
}
