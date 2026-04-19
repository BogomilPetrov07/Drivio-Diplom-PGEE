import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { Language } from '../../../i18n/language'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import { fetchSchoolDetails, updateSchoolDetails } from '../api'

interface Props {
  language: Language
}

export default function SchoolAdminSchoolPage({ language }: Props) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const t = getDashboardTranslations(language).pages.schoolProfile

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const school = await fetchSchoolDetails()
        setName(school.name)
        setAddress(school.address)
        setPhone(school.phone)
      } catch {
        setError(t.loadError)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [t.loadError])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updated = await updateSchoolDetails({ name, address, phone })
      setName(updated.name)
      setAddress(updated.address)
      setPhone(updated.phone)
      setSuccess(t.updateSuccess)
    } catch {
      setError(t.updateError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-base-300/70 bg-base-100 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-semibold text-base-content sm:text-2xl">{t.title}</h2>
        <p className="mt-1 text-sm text-base-content/70">{t.description}</p>
      </div>

      {loading ? (
        <p className="text-sm text-base-content/70">{t.loading}</p>
      ) : (
        <form className="grid gap-3 rounded-xl border border-base-300 p-4" onSubmit={onSubmit}>
          <label className="form-control">
            <span className="label-text">{t.schoolName}</span>
            <input className="input input-bordered" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="form-control">
            <span className="label-text">{t.address}</span>
            <input className="input input-bordered" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </label>
          <label className="form-control">
            <span className="label-text">{t.phone}</span>
            <input className="input input-bordered" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </label>

          <div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? t.saving : t.save}
            </button>
          </div>
        </form>
      )}

      {error ? <div className="alert alert-error"><span>{error}</span></div> : null}
      {success ? <div className="alert alert-success"><span>{success}</span></div> : null}
    </section>
  )
}
