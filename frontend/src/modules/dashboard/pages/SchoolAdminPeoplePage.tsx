import { useEffect, useMemo, useState } from 'react'
import type { Language } from '../../../i18n/language'
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

interface PersonFormState {
  username: string
  email: string
  password: string
  name: string
  role: SchoolPersonRole
  instructorUserId: string
  hasInstructorPrivileges: boolean
}

const defaultFormState: PersonFormState = {
  username: '',
  email: '',
  password: '',
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

  const isBg = language === 'bg'

  const instructorOptions = useMemo(
    () => people.filter((person) => person.role === 'INSTRUCTOR').map((person) => ({ id: person.id, label: person.name || person.username })),
    [people],
  )

  const roleLabel: Record<SchoolPersonRole, string> = {
    SCHOOLADMIN: isBg ? '?????????????' : 'School admin',
    INSTRUCTOR: isBg ? '??????????' : 'Instructor',
    STUDENT: isBg ? '???????' : 'Student',
  }

  const loadPeople = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetchSchoolPeople()
      setPeople(response)
    } catch {
      setError(isBg ? '????????? ????????? ?? ??????.' : 'Failed to load people.')
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
      username: person.username,
      email: person.email ?? '',
      password: '',
      name: person.name ?? '',
      role: person.role,
      instructorUserId: person.studentInstructorUserId ?? '',
      hasInstructorPrivileges: person.hasInstructorProfile,
    })
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const payload: SchoolPersonPayload = {
      username: form.username,
      email: form.email,
      name: form.name,
      role: form.role,
      hasInstructorPrivileges: form.role === 'SCHOOLADMIN' ? form.hasInstructorPrivileges : undefined,
      instructorUserId: form.role === 'STUDENT' ? form.instructorUserId || null : undefined,
      ...(form.password.trim() ? { password: form.password } : {}),
    }

    try {
      if (editingUserId) {
        await updateSchoolPerson(editingUserId, payload)
      } else {
        if (!form.password.trim()) {
          setError(isBg ? '???????? ? ???????????? ?? ??? ?????.' : 'Password is required for new person.')
          setIsSubmitting(false)
          return
        }
        await createSchoolPerson(payload)
      }
      await loadPeople()
      resetForm()
    } catch (submitError: unknown) {
      const message =
        submitError && typeof submitError === 'object' && 'response' in submitError
          ? (submitError as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      setError(message ?? (isBg ? '?????????? ?? ?? ???????.' : 'Operation failed.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const removePerson = async (person: SchoolPerson) => {
    const confirmation = window.confirm(
      isBg ? `????????? ?? ${person.name || person.username}?` : `Delete ${person.name || person.username}?`,
    )
    if (!confirmation) return

    try {
      await deleteSchoolPerson(person.id)
      await loadPeople()
    } catch {
      setError(isBg ? '??????????? ? ?????????.' : 'Delete failed.')
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-base-300/70 bg-base-100 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-semibold text-base-content sm:text-2xl">{isBg ? '???? ? ???????' : 'Driving school people'}</h2>
        <p className="mt-1 text-sm text-base-content/70">
          {isBg ? '??????????, ???????????? ? ?????????? ?????? ??? ?????? ?????.' : 'Create, edit, and delete people in your school.'}
        </p>
      </div>

      <form className="grid gap-3 rounded-xl border border-base-300 p-4" onSubmit={submit}>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="form-control">
            <span className="label-text">{isBg ? '????????????? ???' : 'Username'}</span>
            <input className="input input-bordered" value={form.username} onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))} required />
          </label>
          <label className="form-control">
            <span className="label-text">Email</span>
            <input type="email" className="input input-bordered" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} required />
          </label>
          <label className="form-control">
            <span className="label-text">{isBg ? '???' : 'Name'}</span>
            <input className="input input-bordered" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
          </label>
          <label className="form-control">
            <span className="label-text">{isBg ? '????' : 'Role'}</span>
            <select className="select select-bordered" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as SchoolPersonRole }))}>
              <option value="SCHOOLADMIN">{roleLabel.SCHOOLADMIN}</option>
              <option value="INSTRUCTOR">{roleLabel.INSTRUCTOR}</option>
              <option value="STUDENT">{roleLabel.STUDENT}</option>
            </select>
          </label>
          <label className="form-control md:col-span-2">
            <span className="label-text">
              {editingUserId
                ? isBg
                  ? '???? ?????? (?? ?????)'
                  : 'New password (optional)'
                : isBg
                  ? '??????'
                  : 'Password'}
            </span>
            <input
              type="password"
              className="input input-bordered"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              required={!editingUserId}
            />
          </label>
        </div>

        {form.role === 'STUDENT' ? (
          <label className="form-control">
            <span className="label-text">{isBg ? '??????????' : 'Instructor'}</span>
            <select
              className="select select-bordered"
              value={form.instructorUserId}
              onChange={(e) => setForm((prev) => ({ ...prev, instructorUserId: e.target.value }))}
              required
            >
              <option value="">{isBg ? '???????? ??????????' : 'Select instructor'}</option>
              {instructorOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.label}</option>
              ))}
            </select>
          </label>
        ) : null}

        {form.role === 'SCHOOLADMIN' ? (
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              className="checkbox"
              checked={form.hasInstructorPrivileges}
              onChange={(e) => setForm((prev) => ({ ...prev, hasInstructorPrivileges: e.target.checked }))}
            />
            <span className="label-text">{isBg ? '?????? ? ????????????? ?????' : 'Also grant instructor privileges'}</span>
          </label>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isBg
                ? '?????...'
                : 'Saving...'
              : editingUserId
                ? isBg
                  ? '?????? ?????'
                  : 'Update person'
                : isBg
                  ? '?????? ?????'
                  : 'Create person'}
          </button>
          {editingUserId ? (
            <button className="btn btn-ghost" type="button" onClick={resetForm}>
              {isBg ? '?????' : 'Cancel'}
            </button>
          ) : null}
        </div>
      </form>

      {error ? <div className="alert alert-error"><span>{error}</span></div> : null}

      {loading ? (
        <p className="text-sm text-base-content/70">{isBg ? '?????????...' : 'Loading...'}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-base-300">
          <table className="table">
            <thead>
              <tr>
                <th>{isBg ? '???' : 'Name'}</th>
                <th>{isBg ? '??????????' : 'Username'}</th>
                <th>Email</th>
                <th>{isBg ? '????' : 'Role'}</th>
                <th>{isBg ? '????????' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person.id}>
                  <td>{person.name || '-'}</td>
                  <td>{person.username}</td>
                  <td>{person.email || '-'}</td>
                  <td>{roleLabel[person.role]}{person.role === 'SCHOOLADMIN' && person.hasInstructorProfile ? ` (${isBg ? '? ??????????' : 'also instructor'})` : ''}</td>
                  <td className="space-x-2">
                    <button className="btn btn-xs" type="button" onClick={() => beginEdit(person)}>
                      {isBg ? '????????' : 'Edit'}
                    </button>
                    <button className="btn btn-xs btn-error" type="button" disabled={person.id === user?.id} onClick={() => void removePerson(person)}>
                      {isBg ? '??????' : 'Delete'}
                    </button>
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
