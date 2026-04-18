import { useEffect, useState } from 'react'
import type { Language } from '../../../i18n/language'
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

  const isBg = language === 'bg'

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
        setError(isBg ? '????????? ????????? ?? ???????.' : 'Failed to load driving school details.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [isBg])

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const updated = await updateSchoolDetails({ name, address, phone })
      setName(updated.name)
      setAddress(updated.address)
      setPhone(updated.phone)
      setSuccess(isBg ? '??????? ?? ???????? ???????.' : 'Driving school details were updated.')
    } catch {
      setError(isBg ? '????????? ??????????.' : 'Failed to update school details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-base-300/70 bg-base-100 p-4 sm:p-6">
      <div>
        <h2 className="text-xl font-semibold text-base-content sm:text-2xl">{isBg ? '????? ?? ???????' : 'Driving school details'}</h2>
        <p className="mt-1 text-sm text-base-content/70">
          {isBg ? '???????????? ????????? ?????????? ?? ?????? ?????.' : 'Edit your driving school main information.'}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-base-content/70">{isBg ? '?????????...' : 'Loading...'}</p>
      ) : (
        <form className="grid gap-3 rounded-xl border border-base-300 p-4" onSubmit={onSubmit}>
          <label className="form-control">
            <span className="label-text">{isBg ? '??? ?? ?????' : 'School name'}</span>
            <input className="input input-bordered" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="form-control">
            <span className="label-text">{isBg ? '?????' : 'Address'}</span>
            <input className="input input-bordered" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </label>
          <label className="form-control">
            <span className="label-text">{isBg ? '???????' : 'Phone'}</span>
            <input className="input input-bordered" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </label>

          <div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? (isBg ? '?????...' : 'Saving...') : isBg ? '??????' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {error ? <div className="alert alert-error"><span>{error}</span></div> : null}
      {success ? <div className="alert alert-success"><span>{success}</span></div> : null}
    </section>
  )
}
