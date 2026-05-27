import { useEffect, useState } from 'react'
import { Award, Calendar, CheckCircle, MapPin, Phone, Search, Sparkles, Star, UserCheck, X } from 'lucide-react'
import { getPublicTranslations, type Language } from '../../../i18n/public'
import { fetchPublicSchools, type PublicSchoolListItem } from '../api'
import { BULGARIAN_REGIONS } from '../bulgaria'

const benefitIcons = [CheckCircle, UserCheck, Sparkles, Award]
const stepIcons = [Search, Calendar, Award]

interface ForStudentsProps {
  language: Language
}

export default function ForStudents({ language }: ForStudentsProps) {
  const data = getPublicTranslations(language).students
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [schools, setSchools] = useState<PublicSchoolListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasLoadedSchools, setHasLoadedSchools] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedCity, setSelectedCity] = useState('')

  useEffect(() => {
    if (!isModalOpen || hasLoadedSchools || loading) return

    const loadSchools = async () => {
      try {
        setLoading(true)
        setError('')
        setSchools(await fetchPublicSchools())
      } catch {
        setError(data.modal.loadError)
      } finally {
        setHasLoadedSchools(true)
        setLoading(false)
      }
    }

    void loadSchools()
  }, [data.modal.loadError, hasLoadedSchools, isModalOpen, loading])

  const filteredCities = schools
    .filter((school) => school.region === selectedRegion)
    .map((school) => school.city)
    .filter((city, index, list) => Boolean(city) && list.indexOf(city) === index)
    .sort((a, b) => a.localeCompare(b, 'bg'))

  const filteredSchools = schools.filter((school) => {
    if (!selectedRegion || !selectedCity) return false
    return school.region === selectedRegion && school.city === selectedCity
  })

  return (
    <section id="students" className="bg-base-100 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <span className="badge badge-primary badge-lg mb-4">{data.badge}</span>
          <h2 className="mb-4 text-3xl font-bold text-base-content md:text-4xl">{data.heading}</h2>
          <p className="mx-auto max-w-2xl text-body text-base-content/70">{data.description}</p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
          {data.benefits.map((benefit, index) => {
            const Icon = benefitIcons[index % benefitIcons.length]
            return (
              <div key={index} className="flex gap-4 rounded-xl bg-base-200 p-6">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-body text-base-content/80">{benefit}</p>
              </div>
            )
          })}
        </div>

        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {data.steps.map((step, index) => {
            const Icon = stepIcons[index % stepIcons.length]
            return (
              <div key={index} className="rounded-xl border border-base-content/10 bg-base-100 p-6 shadow-sm">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/15">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1 text-subheading text-base-content">{step.title}</h3>
                <p className="text-helper text-base-content/70">{step.description}</p>
              </div>
            )
          })}
        </div>

        <div className="text-center">
          <button type="button" className="btn btn-primary btn-lg" onClick={() => setIsModalOpen(true)}>
            {data.cta}
          </button>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base-content/45 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="schools-modal-title">
          <div className="relative w-full max-w-3xl rounded-3xl border border-base-content/10 bg-base-100 shadow-2xl">
            <button
              type="button"
              className="btn btn-circle btn-ghost absolute right-4 top-4"
              onClick={() => setIsModalOpen(false)}
              aria-label={data.modal.close}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="border-b border-base-content/10 px-6 py-6 md:px-8">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">{data.modal.eyebrow}</p>
              <h3 id="schools-modal-title" className="text-2xl font-bold text-base-content">{data.modal.title}</h3>
              <p className="mt-2 max-w-2xl text-sm text-base-content/70">{data.modal.description}</p>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-6 md:px-8">
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <label className="form-control gap-1.5">
                  <span className="text-sm font-semibold text-base-content/80">{data.modal.regionLabel}</span>
                  <select
                    className="select select-bordered w-full rounded-xl"
                    value={selectedRegion}
                    onChange={(event) => {
                      setSelectedRegion(event.target.value)
                      setSelectedCity('')
                    }}
                  >
                    <option value="">{data.modal.regionPlaceholder}</option>
                    {BULGARIAN_REGIONS.map((region) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </label>

                <label className="form-control gap-1.5">
                  <span className="text-sm font-semibold text-base-content/80">{data.modal.cityLabel}</span>
                  <select
                    className="select select-bordered w-full rounded-xl"
                    value={selectedCity}
                    onChange={(event) => setSelectedCity(event.target.value)}
                    disabled={!selectedRegion}
                  >
                    <option value="">{data.modal.cityPlaceholder}</option>
                    {filteredCities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </label>
              </div>

              {loading ? <p className="text-base-content/70">{data.modal.loading}</p> : null}
              {!loading && error ? <p className="rounded-2xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">{error}</p> : null}
              {!loading && !error && schools.length === 0 ? <p className="text-base-content/70">{data.modal.empty}</p> : null}
              {!loading && !error && schools.length > 0 && !selectedRegion ? <p className="text-base-content/70">{data.modal.selectRegionHint}</p> : null}
              {!loading && !error && schools.length > 0 && selectedRegion && !selectedCity ? <p className="text-base-content/70">{data.modal.selectCityHint}</p> : null}
              {!loading && !error && selectedRegion && selectedCity && filteredSchools.length === 0 ? <p className="text-base-content/70">{data.modal.noResults}</p> : null}
              {!loading && !error && filteredSchools.length > 0 ? (
                <div className="grid gap-4">
                  {filteredSchools.map((school) => (
                    <article key={school.id} className="rounded-2xl border border-base-content/10 bg-base-200/60 p-5">
                      <h4 className="text-lg font-semibold text-base-content">{school.name}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-base-content/60">
                        <span>{school.city}, {school.region}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/12 px-2.5 py-1 font-medium text-warning">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          {school.rating.toFixed(1)} / 5
                        </span>
                      </div>
                      <div className="mt-3 flex flex-col gap-2 text-sm text-base-content/75">
                        <p className="flex items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                          <span>{school.address}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                          <span>{school.phone}</span>
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
