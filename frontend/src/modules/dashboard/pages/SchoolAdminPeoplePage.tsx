import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ChevronDown, PencilLine, ShieldCheck, Trash2, UserPlus, Users } from 'lucide-react'
import type { Language } from '../../../i18n/language'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import {
  createSchoolPerson,
  deleteSchoolPerson,
  fetchSchoolPeople,
  type SchoolPerson,
  type SchoolPersonPayload,
  type SchoolPersonRole,
  updateSchoolPerson,
} from '../api'
import { useAuth } from '../../auth/hooks'

interface Props {
  language: Language
}

interface SelectOption<T extends string> {
  value: T
  label: string
}

interface DownwardSelectProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: Array<SelectOption<T>>
  className?: string
}

function DownwardSelect<T extends string>({ value, onChange, options, className }: DownwardSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const selected = options.find((option) => option.value === value) ?? options[0]

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (!rootRef.current?.contains(target)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        className="input input-bordered h-11 w-full justify-between rounded-xl border-base-300 bg-base-100/90 px-3 text-left transition-colors hover:border-base-content/35 focus:border-primary focus:outline-none"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{selected?.label ?? ''}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-base-content/70 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? (
        <ul className="absolute left-0 right-0 top-full z-30 mt-2 max-h-64 overflow-auto rounded-xl border border-base-300 bg-base-100 p-1 shadow-xl" role="listbox">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  option.value === value ? 'bg-primary text-primary-content' : 'text-base-content hover:bg-base-200'
                }`}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

interface PersonFormState {
  email: string
  name: string
  role: SchoolPersonRole
  instructorUserId: string
  hasInstructorPrivileges: boolean
}

const defaultFormState: PersonFormState = {
  email: '',
  name: '',
  role: 'INSTRUCTOR',
  instructorUserId: '',
  hasInstructorPrivileges: false,
}

export default function SchoolAdminPeoplePage({ language }: Props) {
  const { user } = useAuth()
  const [people, setPeople] = useState<SchoolPerson[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [form, setForm] = useState<PersonFormState>(defaultFormState)
  const t = getDashboardTranslations(language).pages.schoolPeople

  const instructorOptions = useMemo(
    () => people.filter((person) => person.role === 'INSTRUCTOR').map((person) => ({ id: person.id, label: person.name || person.username })),
    [people],
  )

  const roleLabel: Record<SchoolPersonRole, string> = {
    SCHOOLADMIN: t.roles.schoolAdmin,
    INSTRUCTOR: t.roles.instructor,
    STUDENT: t.roles.student,
  }
  const roleOptions: Array<SelectOption<SchoolPersonRole>> = [
    { value: 'SCHOOLADMIN', label: roleLabel.SCHOOLADMIN },
    { value: 'INSTRUCTOR', label: roleLabel.INSTRUCTOR },
    { value: 'STUDENT', label: roleLabel.STUDENT },
  ]

  const loadPeople = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchSchoolPeople()
      setPeople(response)
    } catch {
      setError(t.loadError)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadPeople()
  }, [])

  const resetForm = () => {
    setEditingUserId(null)
    setForm(defaultFormState)
  }

  const beginEdit = (person: SchoolPerson) => {
    setEditingUserId(person.id)
    setForm({
      email: person.email ?? '',
      name: person.name ?? '',
      role: person.role,
      instructorUserId: person.studentInstructorUserId ?? '',
      hasInstructorPrivileges: person.hasInstructorProfile,
    })
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const payload: SchoolPersonPayload = {
      email: form.email,
      name: form.name,
      role: form.role,
      hasInstructorPrivileges: form.role === 'SCHOOLADMIN' ? form.hasInstructorPrivileges : undefined,
      instructorUserId: form.role === 'STUDENT' ? form.instructorUserId || null : undefined,
    }

    try {
      if (editingUserId) {
        await updateSchoolPerson(editingUserId, payload)
      } else {
        await createSchoolPerson(payload)
      }
      await loadPeople()
      resetForm()
    } catch (submitError: unknown) {
      const message =
        submitError && typeof submitError === 'object' && 'response' in submitError
          ? (submitError as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setError(message ?? t.operationFailed)
    } finally {
      setIsSubmitting(false)
    }
  }

  const removePerson = async (person: SchoolPerson) => {
    const confirmation = window.confirm(t.deleteConfirm.replace('{name}', person.name || person.username))
    if (!confirmation) return

    try {
      await deleteSchoolPerson(person.id)
      await loadPeople()
    } catch {
      setError(t.deleteFailed)
    }
  }

  const inputClassName = 'input input-bordered h-11 w-full rounded-xl border-base-300 bg-base-100/90 transition-colors focus:border-primary focus:outline-none'

  return (
    <section className="space-y-4 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-4 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">{t.title}</h2>
          <p className="mt-1 text-sm text-base-content/70">{t.description}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100/90 px-3 py-1.5 text-sm font-semibold text-base-content shadow-sm">
          <Users className="h-4 w-4 text-primary" />
          <span>{people.length}</span>
        </div>
      </div>

      <form className="rounded-2xl border border-base-300/80 bg-base-100/85 p-4 shadow-sm sm:p-5" onSubmit={submit}>
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-base-content/80">
          {editingUserId ? <PencilLine className="h-4 w-4 text-primary" /> : <UserPlus className="h-4 w-4 text-primary" />}
          <span>{editingUserId ? t.updatePerson : t.createPerson}</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="form-control gap-1.5">
            <span className="label-text text-sm font-semibold text-base-content/80">{t.email}</span>
            <input type="email" className={inputClassName} value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
          </label>
          <label className="form-control gap-1.5">
            <span className="label-text text-sm font-semibold text-base-content/80">{t.name}</span>
            <input className={inputClassName} value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
          </label>
          <label className="form-control gap-1.5 md:col-span-2">
            <span className="label-text text-sm font-semibold text-base-content/80">{t.role}</span>
            <DownwardSelect
              value={form.role}
              onChange={(value) => setForm((prev) => ({ ...prev, role: value }))}
              options={roleOptions}
            />
          </label>
        </div>

        {form.role === 'STUDENT' ? (
          <label className="form-control mt-4 gap-1.5 md:max-w-md">
            <span className="label-text text-xs font-semibold uppercase tracking-wide text-base-content/65">{t.instructor}</span>
            <DownwardSelect
              value={form.instructorUserId}
              onChange={(value) => setForm((prev) => ({ ...prev, instructorUserId: value }))}
              options={[
                { value: '', label: t.selectInstructor },
                ...instructorOptions.map((option) => ({ value: option.id, label: option.label })),
              ]}
            />
          </label>
        ) : null}

        {form.role === 'SCHOOLADMIN' ? (
          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-base-300/80 bg-base-100/70 px-3 py-2">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm"
              checked={form.hasInstructorPrivileges}
              onChange={(e) => setForm((prev) => ({ ...prev, hasInstructorPrivileges: e.target.checked }))}
            />
            <span className="text-sm text-base-content/80">{t.grantInstructorPrivileges}</span>
          </label>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button className="btn btn-primary rounded-xl px-5" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t.saving : editingUserId ? t.updatePerson : t.createPerson}
          </button>
          {editingUserId ? (
            <button className="btn btn-ghost rounded-xl" type="button" onClick={resetForm}>
              {t.cancel}
            </button>
          ) : null}
        </div>
      </form>

      {error ? (
        <div className="alert alert-error rounded-xl border border-error/40 bg-error/10">
          <span>{error}</span>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2 rounded-2xl border border-base-300 bg-base-100/85 p-4">
          <div className="skeleton h-6 w-40 rounded-lg" />
          <div className="skeleton h-12 w-full rounded-lg" />
          <div className="skeleton h-12 w-full rounded-lg" />
          <div className="skeleton h-12 w-full rounded-lg" />
          <p className="pt-1 text-xs text-base-content/60">{t.loading}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100/90 shadow-sm">
          <table className="table table-zebra">
            <thead className="bg-base-200/70 text-xs uppercase tracking-wide text-base-content/70">
              <tr>
                <th>{t.name}</th>
                <th>{t.username}</th>
                <th>{t.email}</th>
                <th>{t.role}</th>
                <th>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person.id}>
                  <td className="font-medium">{person.name || '-'}</td>
                  <td className="text-base-content/85">{person.username}</td>
                  <td className="text-base-content/75">{person.email || '-'}</td>
                  <td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="badge badge-outline border-base-300 bg-base-100 px-2 py-2 text-[11px] font-medium">{roleLabel[person.role]}</span>
                      {person.role === 'SCHOOLADMIN' && person.hasInstructorProfile ? (
                        <span className="badge badge-primary badge-outline gap-1 px-2 py-2 text-[11px]">
                          <ShieldCheck className="h-3 w-3" />
                          {t.alsoInstructor}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="btn btn-xs btn-outline rounded-lg" type="button" onClick={() => beginEdit(person)}>
                        <PencilLine className="h-3 w-3" />
                        {t.edit}
                      </button>
                      <button className="btn btn-xs btn-error rounded-lg" type="button" disabled={person.id === user?.id} onClick={() => void removePerson(person)}>
                        <Trash2 className="h-3 w-3" />
                        {t.delete}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
