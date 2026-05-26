import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CarFront, PencilLine, Plus, Trash2 } from 'lucide-react'
import type { Language } from '../../../i18n/language'
import { createSchoolCar, deleteSchoolCar, fetchSchoolCars, type SchoolCar, type SchoolCarPayload, updateSchoolCar } from '../api'
import { useDashboardShell } from '../hooks'

interface Props { language: Language }

interface CarFormState {
  licensePlate: string
  isAvailable: boolean
  ptiExpireDate: string
  vignetteExpireDate: string
}

const defaultFormState: CarFormState = {
  licensePlate: '',
  isAvailable: true,
  ptiExpireDate: '',
  vignetteExpireDate: '',
}

export default function SchoolAdminCarsPage({ language }: Props) {
  const isBg = language === 'bg'
  const { pushToast } = useDashboardShell()
  const [cars, setCars] = useState<SchoolCar[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCarId, setEditingCarId] = useState<string | null>(null)
  const [form, setForm] = useState<CarFormState>(defaultFormState)

  const loadCars = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchSchoolCars()
      setCars(data)
    } catch {
      pushToast('error', isBg ? 'Не успяхме да заредим автомобилите.' : 'Could not load vehicles.')
    } finally {
      setLoading(false)
    }
  }, [isBg, pushToast])

  useEffect(() => {
    void loadCars()
  }, [loadCars])

  const resetForm = () => {
    setEditingCarId(null)
    setForm(defaultFormState)
  }

  const beginEdit = (car: SchoolCar) => {
    setEditingCarId(car.id)
    setForm({
      licensePlate: car.licensePlate,
      isAvailable: car.isAvailable,
      ptiExpireDate: car.ptiExpireDate.slice(0, 10),
      vignetteExpireDate: car.vignetteExpireDate.slice(0, 10),
    })
  }

  const toPayload = (): SchoolCarPayload => ({
    licensePlate: form.licensePlate,
    isAvailable: form.isAvailable,
    ptiExpireDate: `${form.ptiExpireDate}T00:00:00.000Z`,
    vignetteExpireDate: `${form.vignetteExpireDate}T00:00:00.000Z`,
  })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingCarId) {
        await updateSchoolCar(editingCarId, toPayload())
      } else {
        await createSchoolCar(toPayload())
      }
      await loadCars()
      resetForm()
      pushToast('success', isBg ? 'Автомобилът е запазен.' : 'Vehicle saved.')
    } catch {
      pushToast('error', isBg ? 'Записването е неуспешно.' : 'Save failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (car: SchoolCar) => {
    const confirmed = window.confirm(
      isBg ? `Да изтрия ли ${car.licensePlate}?` : `Delete ${car.licensePlate}?`,
    )
    if (!confirmed) return

    try {
      await deleteSchoolCar(car.id)
      await loadCars()
      pushToast('success', isBg ? 'Автомобилът е изтрит.' : 'Vehicle deleted.')
    } catch {
      pushToast('error', isBg ? 'Изтриването е неуспешно.' : 'Delete failed.')
    }
  }

  const inputClassName = 'input input-bordered h-11 w-full rounded-xl border-base-300 bg-base-100/90 transition-colors focus:border-primary focus:outline-none'

  return (
    <section className="space-y-4 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-4 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
            {isBg ? 'Коли' : 'Cars'}
          </h2>
          <p className="mt-1 text-sm text-base-content/70">
            {isBg ? 'Управлявайте автомобилите и техническите срокове на школата.' : 'Manage school vehicles and their technical deadlines.'}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100/90 px-3 py-1.5 text-sm font-semibold text-base-content shadow-sm">
          <CarFront className="h-4 w-4 text-primary" />
          <span>{cars.length}</span>
        </div>
      </div>

      <form className="rounded-2xl border border-base-300/80 bg-base-100/85 p-4 shadow-sm sm:p-5" onSubmit={handleSubmit}>
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-base-content/80">
          {editingCarId ? <PencilLine className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
          <span>{editingCarId ? (isBg ? 'Редакция на автомобил' : 'Edit vehicle') : (isBg ? 'Добавяне на автомобил' : 'Add vehicle')}</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="form-control gap-1.5">
            <span className="label-text text-sm font-semibold text-base-content/80">{isBg ? 'Регистрационен номер' : 'License plate'}</span>
            <input className={inputClassName} value={form.licensePlate} onChange={(e) => setForm((prev) => ({ ...prev, licensePlate: e.target.value }))} required />
          </label>

          <label className="mt-8 flex cursor-pointer items-center gap-3 rounded-xl border border-base-300/80 bg-base-100/70 px-3 py-2">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm"
              checked={form.isAvailable}
              onChange={(e) => setForm((prev) => ({ ...prev, isAvailable: e.target.checked }))}
            />
            <span className="text-sm text-base-content/80">{isBg ? 'Автомобилът е наличен' : 'Vehicle is available'}</span>
          </label>

          <label className="form-control gap-1.5">
            <span className="label-text text-sm font-semibold text-base-content/80">{isBg ? 'ГТП до' : 'PTI valid until'}</span>
            <input type="date" className={inputClassName} value={form.ptiExpireDate} onChange={(e) => setForm((prev) => ({ ...prev, ptiExpireDate: e.target.value }))} required />
          </label>

          <label className="form-control gap-1.5">
            <span className="label-text text-sm font-semibold text-base-content/80">{isBg ? 'Винетка до' : 'Vignette valid until'}</span>
            <input type="date" className={inputClassName} value={form.vignetteExpireDate} onChange={(e) => setForm((prev) => ({ ...prev, vignetteExpireDate: e.target.value }))} required />
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button className="btn btn-primary rounded-xl px-5" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isBg ? 'Запазване...' : 'Saving...') : (editingCarId ? (isBg ? 'Обнови автомобил' : 'Update vehicle') : (isBg ? 'Добави автомобил' : 'Add vehicle'))}
          </button>
          {editingCarId ? (
            <button className="btn btn-ghost rounded-xl" type="button" onClick={resetForm}>
              {isBg ? 'Отказ' : 'Cancel'}
            </button>
          ) : null}
        </div>
      </form>

      {loading ? (
        <div className="space-y-2 rounded-2xl border border-base-300 bg-base-100/85 p-4">
          <div className="skeleton h-6 w-40 rounded-lg" />
          <div className="skeleton h-12 w-full rounded-lg" />
          <div className="skeleton h-12 w-full rounded-lg" />
        </div>
      ) : cars.length === 0 ? (
        <div className="rounded-xl border border-dashed border-base-300 bg-base-100/60 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-base-content">
            {isBg ? 'Все още няма добавени автомобили.' : 'No vehicles have been added yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-base-300 bg-base-100/90 shadow-sm">
          <table className="table table-zebra">
            <thead className="bg-base-200/70 text-xs uppercase tracking-wide text-base-content/70">
              <tr>
                <th>{isBg ? 'Номер' : 'Plate'}</th>
                <th>{isBg ? 'Статус' : 'Status'}</th>
                <th>{isBg ? 'ГТП' : 'PTI'}</th>
                <th>{isBg ? 'Винетка' : 'Vignette'}</th>
                <th>{isBg ? 'Действия' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car.id}>
                  <td className="font-medium">{car.licensePlate}</td>
                  <td>
                    <span className={`badge ${car.isAvailable ? 'badge-success' : 'badge-ghost'}`}>
                      {car.isAvailable ? (isBg ? 'Наличен' : 'Available') : (isBg ? 'Зает/спрян' : 'Unavailable')}
                    </span>
                  </td>
                  <td>{new Date(car.ptiExpireDate).toLocaleDateString(isBg ? 'bg-BG' : 'en-US')}</td>
                  <td>{new Date(car.vignetteExpireDate).toLocaleDateString(isBg ? 'bg-BG' : 'en-US')}</td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      <button className="btn btn-xs btn-outline rounded-lg" type="button" onClick={() => beginEdit(car)}>
                        <PencilLine className="h-3 w-3" />
                        {isBg ? 'Редакция' : 'Edit'}
                      </button>
                      <button className="btn btn-xs btn-error rounded-lg" type="button" onClick={() => void handleDelete(car)}>
                        <Trash2 className="h-3 w-3" />
                        {isBg ? 'Изтрий' : 'Delete'}
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
