import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Building2, MapPin, Phone, ShieldCheck, Star } from 'lucide-react'
import type { Language } from '../../../i18n/language'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import { fetchSchoolDetails, updateSchoolDetails } from '../api'
import { useDashboardShell } from '../hooks'

interface Props {
  language: Language
}

export default function SchoolAdminSchoolPage({ language }: Props) {
  const { pushToast } = useDashboardShell()
  const [name, setName] = useState('')
  const [region, setRegion] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [rating, setRating] = useState(5)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const t = getDashboardTranslations(language).pages.schoolProfile

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const school = await fetchSchoolDetails()
        setName(school.name)
        setRegion(school.region)
        setCity(school.city)
        setAddress(school.address)
        setPhone(school.phone)
        setRating(school.rating)
      } catch {
        pushToast('error', t.loadError)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [pushToast, t.loadError])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    try {
      const updated = await updateSchoolDetails({ name, region, city, address, phone, rating })
      setName(updated.name)
      setRegion(updated.region)
      setCity(updated.city)
      setAddress(updated.address)
      setPhone(updated.phone)
      setRating(updated.rating)
      pushToast('success', t.updateSuccess)
    } catch {
      pushToast('error', t.updateError)
    } finally {
      setSaving(false)
    }
  }

  const inputClassName = 'input input-bordered h-12 w-full rounded-xl border-base-300 bg-base-100/90 text-base-content transition-colors focus:border-primary focus:outline-none'

  return (
    <section className="space-y-4 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-4 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">{t.title}</h2>
          <p className="mt-1 text-sm text-base-content/70">{t.description}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100/90 px-3 py-1.5 text-sm font-semibold text-base-content shadow-sm">
          <Building2 className="h-4 w-4 text-primary" />
          <span>{name || 'School'}</span>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.35fr]">
          <div className="rounded-2xl border border-base-300/80 bg-base-100/90 p-5 shadow-sm">
            <div className="skeleton h-5 w-32 rounded-md" />
            <div className="mt-4 space-y-3">
              <div className="skeleton h-12 w-full rounded-xl" />
              <div className="skeleton h-12 w-full rounded-xl" />
              <div className="skeleton h-12 w-full rounded-xl" />
            </div>
          </div>
          <div className="rounded-2xl border border-base-300/80 bg-base-100/90 p-5 shadow-sm">
            <div className="skeleton h-5 w-48 rounded-md" />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="skeleton h-24 w-full rounded-2xl" />
              <div className="skeleton h-24 w-full rounded-2xl" />
              <div className="skeleton h-24 w-full rounded-2xl md:col-span-2" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.35fr]">
          <aside className="rounded-2xl border border-base-300/80 bg-base-100/90 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-base-content/55">
              {language === 'bg' ? 'Текущ преглед' : 'Current overview'}
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-base-300/80 bg-base-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs text-base-content/60">{t.schoolName}</p>
                    <p className="text-sm font-semibold text-base-content">{name || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-base-300/80 bg-base-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs text-base-content/60">{t.city}</p>
                    <p className="text-sm font-semibold text-base-content">{city && region ? `${city}, ${region}` : '-'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-base-300/80 bg-base-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs text-base-content/60">{t.address}</p>
                    <p className="text-sm font-semibold text-base-content">{address || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-base-300/80 bg-base-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs text-base-content/60">{t.phone}</p>
                    <p className="text-sm font-semibold text-base-content">{phone || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-base-300/80 bg-base-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Star className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs text-base-content/60">{language === 'bg' ? 'Рейтинг' : 'Rating'}</p>
                    <p className="text-sm font-semibold text-base-content">{rating.toFixed(1)} / 5</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <form className="rounded-2xl border border-base-300/80 bg-base-100/90 p-5 shadow-sm" onSubmit={onSubmit}>
            <div className="mb-5 flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-base-content">
                  {language === 'bg' ? 'Редакция на организационни данни' : 'Update organization details'}
                </p>
                <p className="text-xs text-base-content/60">
                  {language === 'bg'
                    ? 'Промените се използват в останалите части на платформата.'
                    : 'Changes are reflected across the rest of the platform.'}
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <label className="form-control gap-1.5">
                <span className="label-text text-sm font-semibold text-base-content/80">{t.schoolName}</span>
                <input className={inputClassName} value={name} onChange={(e) => setName(e.target.value)} required />
              </label>

              <label className="form-control gap-1.5">
                <span className="label-text text-sm font-semibold text-base-content/80">{t.region}</span>
                <input className={inputClassName} value={region} onChange={(e) => setRegion(e.target.value)} required />
              </label>

              <label className="form-control gap-1.5">
                <span className="label-text text-sm font-semibold text-base-content/80">{t.city}</span>
                <input className={inputClassName} value={city} onChange={(e) => setCity(e.target.value)} required />
              </label>

              <label className="form-control gap-1.5 md:col-span-2">
                <span className="label-text text-sm font-semibold text-base-content/80">{t.address}</span>
                <input className={inputClassName} value={address} onChange={(e) => setAddress(e.target.value)} required />
              </label>

              <label className="form-control gap-1.5 md:max-w-sm">
                <span className="label-text text-sm font-semibold text-base-content/80">{t.phone}</span>
                <input className={inputClassName} value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </label>

              <label className="form-control gap-1.5 md:max-w-sm">
                <span className="label-text text-sm font-semibold text-base-content/80">{language === 'bg' ? 'Рейтинг' : 'Rating'}</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  className={inputClassName}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  required
                />
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end">
              <button className="btn btn-primary min-w-36 rounded-xl px-5" type="submit" disabled={saving}>
                {saving ? t.saving : t.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
