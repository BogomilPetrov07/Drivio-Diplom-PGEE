import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Building2, GraduationCap, RefreshCw, School, ShieldCheck, UserCheck, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Language } from '../../../i18n/language'
import { useAuth } from '../../auth/hooks'
import { fetchSchoolDetails, fetchSchoolPeople, type SchoolPerson, type SchoolPersonRole } from '../api'

interface Props {
  language: Language
}

type RoleFilter = 'ALL' | SchoolPersonRole

const COPY = {
  bg: {
    loadError: 'Не успяхме да заредим началния преглед за школата.',
    refreshError: 'Опресняването не бе успешно. Опитайте отново.',
    title: 'Начало на администратора',
    subtitle: (schoolName: string | null, username: string) =>
      schoolName
        ? `Оперативен преглед за ${schoolName}. Показваме само информация, която вече е обработена в платформата, ${username}.`
        : `Оперативен преглед на школата. Показваме само информация, която вече е обработена в платформата, ${username}.`,
    refresh: 'Опресни',
    refreshing: 'Опресняване...',
    overview: 'Общ преглед',
    roster: 'Екип и курсисти',
    schoolCard: 'Профил на школа',
    rosterCard: 'Последно добавени хора',
    filteredRoster: 'Филтриран списък',
    quickActions: 'Бързи действия',
    schoolName: 'Име',
    schoolAddress: 'Адрес',
    schoolPhone: 'Телефон',
    createdAt: 'Създадена',
    updatedAt: 'Последна промяна',
    totalPeople: 'Общо хора',
    students: 'Курсисти',
    instructors: 'Инструктори',
    admins: 'Администратори',
    instructorAdmins: 'Админи с права на инструктор',
    assignedStudents: 'Курсисти с инструктор',
    unassignedStudents: 'Курсисти без инструктор',
    latestPeopleHint: 'Последните регистрации в школата.',
    rosterHint: 'Преглед по роля върху вече създадените профили.',
    noPeople: 'Все още няма създадени профили в школата.',
    noFilteredPeople: 'Няма хора за този филтър.',
    emptyValue: 'Няма данни',
    roleAll: 'Всички',
    roleSchoolAdmin: 'Администратори',
    roleInstructor: 'Инструктори',
    roleStudent: 'Курсисти',
    quickPeople: 'Управлявай хора',
    quickSchool: 'Редактирай профила',
    quickInstructor: 'Отвори графика',
    quickSupport: 'Помощ',
    goTo: 'Отвори',
    memberSince: 'в системата от',
    linkedInstructor: 'Свързан с инструктор',
    noLinkedInstructor: 'Без избран инструктор',
  },
  en: {
    loadError: 'We could not load the school dashboard overview.',
    refreshError: 'Refresh failed. Please try again.',
    title: 'Admin home',
    subtitle: (schoolName: string | null, username: string) =>
      schoolName
        ? `Operational snapshot for ${schoolName}. Showing only information already processed in the platform, ${username}.`
        : `Operational school snapshot. Showing only information already processed in the platform, ${username}.`,
    refresh: 'Refresh',
    refreshing: 'Refreshing...',
    overview: 'Overview',
    roster: 'Team and students',
    schoolCard: 'School profile',
    rosterCard: 'Recently added people',
    filteredRoster: 'Filtered roster',
    quickActions: 'Quick actions',
    schoolName: 'Name',
    schoolAddress: 'Address',
    schoolPhone: 'Phone',
    createdAt: 'Created',
    updatedAt: 'Updated',
    totalPeople: 'Total people',
    students: 'Students',
    instructors: 'Instructors',
    admins: 'Admins',
    instructorAdmins: 'Admins with instructor access',
    assignedStudents: 'Students with instructor',
    unassignedStudents: 'Students without instructor',
    latestPeopleHint: 'Most recent profiles added to the school.',
    rosterHint: 'Role-based view across profiles already created.',
    noPeople: 'No school profiles have been created yet.',
    noFilteredPeople: 'No people match this filter.',
    emptyValue: 'No data',
    roleAll: 'All',
    roleSchoolAdmin: 'Admins',
    roleInstructor: 'Instructors',
    roleStudent: 'Students',
    quickPeople: 'Manage people',
    quickSchool: 'Edit profile',
    quickInstructor: 'Open schedule',
    quickSupport: 'Help',
    goTo: 'Open',
    memberSince: 'in the platform since',
    linkedInstructor: 'Instructor assigned',
    noLinkedInstructor: 'No instructor assigned',
  },
} as const

function formatDate(value: string | null | undefined, language: Language) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return new Intl.DateTimeFormat(language === 'bg' ? 'bg-BG' : 'en-US', {
    dateStyle: 'medium',
  }).format(parsed)
}

function roleBadgeClass(role: SchoolPersonRole) {
  if (role === 'SCHOOLADMIN') return 'border-info/30 bg-info/10 text-info'
  if (role === 'INSTRUCTOR') return 'border-success/30 bg-success/10 text-success'
  return 'border-warning/30 bg-warning/10 text-warning'
}

export default function SchoolAdminDashboardPage({ language }: Props) {
  const { user } = useAuth()
  const t = COPY[language]
  const [people, setPeople] = useState<SchoolPerson[]>([])
  const [school, setSchool] = useState<Awaited<ReturnType<typeof fetchSchoolDetails>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const [schoolResponse, peopleResponse] = await Promise.all([
          fetchSchoolDetails(),
          fetchSchoolPeople(),
        ])

        if (!active) return
        setSchool(schoolResponse)
        setPeople(peopleResponse)
      } catch {
        if (!active) return
        setError(t.loadError)
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [t.loadError])

  const refresh = async () => {
    setRefreshing(true)
    setError(null)

    try {
      const [schoolResponse, peopleResponse] = await Promise.all([
        fetchSchoolDetails(),
        fetchSchoolPeople(),
      ])
      setSchool(schoolResponse)
      setPeople(peopleResponse)
    } catch {
      setError(t.refreshError)
    } finally {
      setRefreshing(false)
    }
  }

  const roleCounts = useMemo(() => {
    const counts = {
      SCHOOLADMIN: 0,
      INSTRUCTOR: 0,
      STUDENT: 0,
    }

    for (const person of people) {
      counts[person.role] += 1
    }

    return counts
  }, [people])

  const schoolAdminInstructorPrivileges = useMemo(
    () => people.filter((person) => person.role === 'SCHOOLADMIN' && person.hasInstructorProfile).length,
    [people],
  )

  const studentAssignmentStats = useMemo(() => {
    const students = people.filter((person) => person.role === 'STUDENT')
    const assigned = students.filter((person) => person.studentInstructorUserId).length
    return {
      assigned,
      unassigned: students.length - assigned,
    }
  }, [people])

  const latestPeople = useMemo(
    () => [...people].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [people],
  )

  const filteredPeople = useMemo(() => {
    const base = roleFilter === 'ALL' ? people : people.filter((person) => person.role === roleFilter)
    return [...base].sort((a, b) => {
      const aName = (a.name || a.username).toLowerCase()
      const bName = (b.name || b.username).toLowerCase()
      return aName.localeCompare(bName)
    })
  }, [people, roleFilter])

  const roleFilterLabels: Record<RoleFilter, string> = {
    ALL: t.roleAll,
    SCHOOLADMIN: t.roleSchoolAdmin,
    INSTRUCTOR: t.roleInstructor,
    STUDENT: t.roleStudent,
  }

  const summaryCards = [
    { icon: <UsersRound className="h-5 w-5" />, label: t.totalPeople, value: people.length },
    { icon: <GraduationCap className="h-5 w-5" />, label: t.students, value: roleCounts.STUDENT },
    { icon: <UserCheck className="h-5 w-5" />, label: t.instructors, value: roleCounts.INSTRUCTOR },
    { icon: <ShieldCheck className="h-5 w-5" />, label: t.admins, value: roleCounts.SCHOOLADMIN },
    { icon: <School className="h-5 w-5" />, label: t.assignedStudents, value: studentAssignmentStats.assigned },
    { icon: <Building2 className="h-5 w-5" />, label: t.unassignedStudents, value: studentAssignmentStats.unassigned },
  ]

  const quickActions = [
    { to: '/dashboard/schooladmin/people', label: t.quickPeople },
    { to: '/dashboard/schooladmin/school', label: t.quickSchool },
    ...(user?.hasInstructorPrivileges ? [{ to: '/dashboard/schooladmin/instructor/schedule', label: t.quickInstructor }] : []),
    { to: '/dashboard/schooladmin/support', label: t.quickSupport },
  ]

  return (
    <section className="space-y-4 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-4 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">{t.title}</h2>
          <p className="mt-1 text-sm text-base-content/70">
            {t.subtitle(school?.name ?? null, user?.username || 'admin')}
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline"
          onClick={() => void refresh()}
          disabled={loading || refreshing}
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? t.refreshing : t.refresh}
        </button>
      </div>

      {error ? (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-xl border border-base-300/80 bg-base-100/85 p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-base-200 text-primary">
                {card.icon}
              </div>
              <div>
                <p className="text-xl font-semibold text-base-content">{loading ? '...' : card.value}</p>
                <p className="text-sm text-base-content/70">{card.label}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-base-300/80 bg-base-100/85 p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-base-content">{t.schoolCard}</h3>
                <p className="mt-1 text-sm text-base-content/70">{t.overview}</p>
              </div>
              <Link className="btn btn-sm btn-ghost" to="/dashboard/schooladmin/school">
                {t.goTo}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <dt className="text-sm font-medium text-base-content/70">{t.schoolName}</dt>
                <dd className="mt-1 text-base text-base-content">{loading ? '...' : (school?.name || t.emptyValue)}</dd>
              </div>
              <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <dt className="text-sm font-medium text-base-content/70">{t.schoolPhone}</dt>
                <dd className="mt-1 text-base text-base-content">{loading ? '...' : (school?.phone || t.emptyValue)}</dd>
              </div>
              <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <dt className="text-sm font-medium text-base-content/70">{t.schoolAddress}</dt>
                <dd className="mt-1 text-base text-base-content">{loading ? '...' : (school?.address || t.emptyValue)}</dd>
              </div>
              <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <dt className="text-sm font-medium text-base-content/70">{t.createdAt}</dt>
                <dd className="mt-1 text-base text-base-content">{loading ? '...' : (formatDate(school?.createdAt, language) || t.emptyValue)}</dd>
                <p className="mt-2 text-xs text-base-content/60">
                  {t.updatedAt}: {loading ? '...' : (formatDate(school?.updatedAt, language) || t.emptyValue)}
                </p>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-base-300/80 bg-base-100/85 p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-base-content">{t.filteredRoster}</h3>
                <p className="mt-1 text-sm text-base-content/70">{t.rosterHint}</p>
              </div>
              <Link className="btn btn-sm btn-ghost" to="/dashboard/schooladmin/people">
                {t.goTo}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.keys(roleFilterLabels) as RoleFilter[]).map((filterKey) => (
                <button
                  key={filterKey}
                  type="button"
                  className={`btn btn-sm ${roleFilter === filterKey ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setRoleFilter(filterKey)}
                >
                  {roleFilterLabels[filterKey]}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-xl bg-base-200/70" />
                ))}
              </div>
            ) : filteredPeople.length === 0 ? (
              <p className="mt-4 text-sm text-base-content/70">{people.length === 0 ? t.noPeople : t.noFilteredPeople}</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {filteredPeople.slice(0, 6).map((person) => (
                  <article key={person.id} className="rounded-xl border border-base-300 bg-base-100 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-base-content">{person.name || person.username}</h4>
                        <p className="mt-1 text-sm text-base-content/70">{person.email || person.username}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${roleBadgeClass(person.role)}`}>
                        {roleFilterLabels[person.role]}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-base-content/60">
                      <span className="rounded-full bg-base-200 px-3 py-1">
                        {t.memberSince} {formatDate(person.createdAt, language) || t.emptyValue}
                      </span>
                      {person.role === 'SCHOOLADMIN' && person.hasInstructorProfile ? (
                        <span className="rounded-full bg-success/10 px-3 py-1 text-success">{t.instructorAdmins}</span>
                      ) : null}
                      {person.role === 'STUDENT' ? (
                        <span className={`rounded-full px-3 py-1 ${person.studentInstructorUserId ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
                          {person.studentInstructorUserId ? t.linkedInstructor : t.noLinkedInstructor}
                        </span>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-base-300/80 bg-base-100/85 p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-base-content">{t.rosterCard}</h3>
                <p className="mt-1 text-sm text-base-content/70">{t.latestPeopleHint}</p>
              </div>
              <UsersRound className="mt-1 h-5 w-5 text-base-content/45" />
            </div>

            {loading ? (
              <div className="mt-4 space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-xl bg-base-200/70" />
                ))}
              </div>
            ) : latestPeople.length === 0 ? (
              <p className="mt-4 text-sm text-base-content/70">{t.noPeople}</p>
            ) : (
              <div className="mt-4 space-y-3">
                {latestPeople.map((person) => (
                  <div key={person.id} className="rounded-xl border border-base-300 bg-base-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-base-content">{person.name || person.username}</p>
                        <p className="mt-1 text-xs text-base-content/60">{formatDate(person.createdAt, language) || t.emptyValue}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${roleBadgeClass(person.role)}`}>
                        {roleFilterLabels[person.role]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-base-300/80 bg-base-100/85 p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-base-content">{t.roster}</h3>
                <p className="mt-1 text-sm text-base-content/70">{t.overview}</p>
              </div>
              <ShieldCheck className="mt-1 h-5 w-5 text-base-content/45" />
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <p className="text-sm text-base-content/70">{t.instructorAdmins}</p>
                <p className="mt-1 text-2xl font-semibold text-base-content">{loading ? '...' : schoolAdminInstructorPrivileges}</p>
              </div>
              <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <p className="text-sm text-base-content/70">{t.assignedStudents}</p>
                <p className="mt-1 text-2xl font-semibold text-base-content">{loading ? '...' : studentAssignmentStats.assigned}</p>
              </div>
              <div className="rounded-xl border border-base-300 bg-base-100 p-4">
                <p className="text-sm text-base-content/70">{t.unassignedStudents}</p>
                <p className="mt-1 text-2xl font-semibold text-base-content">{loading ? '...' : studentAssignmentStats.unassigned}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-base-300/80 bg-base-100/85 p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-base-content">{t.quickActions}</h3>
                <p className="mt-1 text-sm text-base-content/70">{t.overview}</p>
              </div>
              <ArrowRight className="mt-1 h-5 w-5 text-base-content/45" />
            </div>

            <div className="mt-4 grid gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="flex items-center justify-between rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm font-medium text-base-content transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <span>{action.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  )
}
