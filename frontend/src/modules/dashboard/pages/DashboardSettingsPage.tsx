import { Globe, Monitor, MoonStar, MousePointer2, PanelTop, PlaySquare, SlidersHorizontal, Sun, Zap } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import type { Language } from '../../../i18n/language'
import { getDashboardTranslations } from '../../../i18n/dashboard'
import {
  getDashboardStartPage,
  setDashboardStartPage,
  type InterfaceDensityPreference,
  type MotionPreference,
  type ThemePreference,
} from '../../../utils/preferences'
import { useAuth } from '../../auth/hooks'
import { useDashboardShell } from '../hooks'

interface Props {
  language: Language
  setLanguage: (language: Language) => void
  themePreference: ThemePreference
  setThemePreference: (theme: ThemePreference) => void
  interfaceDensity: InterfaceDensityPreference
  setInterfaceDensity: (density: InterfaceDensityPreference) => void
  motionPreference: MotionPreference
  setMotionPreference: (motion: MotionPreference) => void
}

interface StartPageOption {
  value: string
  labelBg: string
  labelEn: string
}

function getRoleSegment(pathname: string) {
  if (pathname.startsWith('/dashboard/superadmin')) return 'superadmin'
  if (pathname.startsWith('/dashboard/schooladmin')) return 'schooladmin'
  if (pathname.startsWith('/dashboard/instructor')) return 'instructor'
  return 'student'
}

export default function DashboardSettingsPage({
  language,
  setLanguage,
  themePreference,
  setThemePreference,
  interfaceDensity,
  setInterfaceDensity,
  motionPreference,
  setMotionPreference,
}: Props) {
  const t = getDashboardTranslations(language).pages.settings
  const { pushToast } = useDashboardShell()
  const { user } = useAuth()
  const location = useLocation()
  const isBg = language === 'bg'
  const roleSegment = getRoleSegment(location.pathname)

  const [startPage, setStartPage] = useState<string>(() => getDashboardStartPage(roleSegment) ?? '')

  useEffect(() => {
    setStartPage(getDashboardStartPage(roleSegment) ?? '')
  }, [roleSegment])

  const startPageOptions = useMemo<StartPageOption[]>(() => {
    if (roleSegment === 'superadmin') {
      return [
        { value: '/dashboard/superadmin/home', labelBg: 'Начало', labelEn: 'Home' },
        { value: '/dashboard/superadmin/requests', labelBg: 'Заявки', labelEn: 'Requests' },
        { value: '/dashboard/superadmin/support', labelBg: 'Поддръжка', labelEn: 'Support' },
        { value: '/dashboard/superadmin/statistics', labelBg: 'Статистика', labelEn: 'Statistics' },
      ]
    }

    if (roleSegment === 'schooladmin') {
      const options: StartPageOption[] = [
        { value: '/dashboard/schooladmin/home', labelBg: 'Начало', labelEn: 'Home' },
        { value: '/dashboard/schooladmin/school', labelBg: 'Профил на школа', labelEn: 'School profile' },
        { value: '/dashboard/schooladmin/people', labelBg: 'Хора', labelEn: 'People' },
        { value: '/dashboard/schooladmin/cars', labelBg: 'Коли', labelEn: 'Cars' },
        { value: '/dashboard/schooladmin/support', labelBg: 'Помощ', labelEn: 'Support' },
      ]

      if (user?.hasInstructorPrivileges) {
        options.splice(
          4,
          0,
          { value: '/dashboard/schooladmin/instructor/planner', labelBg: 'Планер', labelEn: 'Planner' },
          { value: '/dashboard/schooladmin/instructor/schedule', labelBg: 'График', labelEn: 'Schedule' },
          { value: '/dashboard/schooladmin/instructor/students', labelBg: 'Курсисти', labelEn: 'Students' },
        )
      }

      return options
    }

    if (roleSegment === 'instructor') {
      return [
        { value: '/dashboard/instructor/home', labelBg: 'Начало', labelEn: 'Home' },
        { value: '/dashboard/instructor/planner', labelBg: 'Планер', labelEn: 'Planner' },
        { value: '/dashboard/instructor/schedule', labelBg: 'График', labelEn: 'Schedule' },
        { value: '/dashboard/instructor/students', labelBg: 'Курсисти', labelEn: 'Students' },
        { value: '/dashboard/instructor/support', labelBg: 'Помощ', labelEn: 'Support' },
      ]
    }

    return [
      { value: '/dashboard/student/home', labelBg: 'Начало', labelEn: 'Home' },
      { value: '/dashboard/student/schedule', labelBg: 'График', labelEn: 'Schedule' },
      { value: '/dashboard/student/progress', labelBg: 'Прогрес', labelEn: 'Progress' },
      { value: '/dashboard/student/instructors', labelBg: 'Инструктори', labelEn: 'Instructors' },
      { value: '/dashboard/student/support', labelBg: 'Помощ', labelEn: 'Support' },
    ]
  }, [roleSegment, user?.hasInstructorPrivileges])

  const currentStartPage = startPage || startPageOptions[0]?.value || ''

  const handleLanguageChange = (nextLanguage: Language) => {
    setLanguage(nextLanguage)
    pushToast(nextLanguage === 'bg' ? 'success' : 'success', nextLanguage === 'bg' ? 'Езикът е сменен на български.' : 'Language switched to English.')
  }

  const handleThemeChange = (nextTheme: ThemePreference) => {
    setThemePreference(nextTheme)
    pushToast('success', isBg ? 'Темата е обновена.' : 'Theme updated.')
  }

  const handleDensityChange = (nextDensity: InterfaceDensityPreference) => {
    setInterfaceDensity(nextDensity)
    document.documentElement.classList.toggle('drivio-compact-ui', nextDensity === 'compact')
    document.documentElement.style.fontSize = nextDensity === 'compact' ? '15px' : '16px'
    pushToast('success', isBg ? 'Плътността на интерфейса е обновена.' : 'Interface density updated.')
  }

  const handleMotionChange = (nextMotion: MotionPreference) => {
    setMotionPreference(nextMotion)
    document.documentElement.classList.toggle('drivio-reduced-motion', nextMotion === 'reduced')
    pushToast('success', isBg ? 'Предпочитанието за движение е обновено.' : 'Motion preference updated.')
  }

  const handleStartPageChange = (value: string) => {
    setStartPage(value)
    setDashboardStartPage(roleSegment, value)
    pushToast('success', isBg ? 'Началният екран е запазен.' : 'Default start page saved.')
  }

  const roleLabel =
    roleSegment === 'superadmin'
      ? isBg
        ? 'Суперадминистратор'
        : 'Super admin'
      : roleSegment === 'schooladmin'
        ? isBg
          ? 'Администратор на школа'
          : 'School admin'
        : roleSegment === 'instructor'
          ? isBg
            ? 'Инструктор'
            : 'Instructor'
          : isBg
            ? 'Курсист'
            : 'Student'

  return (
    <section className="space-y-5 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-4 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">{t.title}</h2>
          <p className="mt-1 text-sm text-base-content/70">
            {isBg ? 'Настройките се прилагат веднага и важат за текущата роля и табло.' : 'These settings apply instantly and affect the current role dashboard.'}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100/90 px-3 py-1.5 text-sm font-semibold text-base-content shadow-sm">
          <PanelTop className="h-4 w-4 text-primary" />
          <span>{roleLabel}</span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-2xl border border-base-300/80 bg-base-100/90 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-base-content">{t.interfaceTitle}</h3>
              <p className="text-sm text-base-content/65">{t.interfaceHint}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => handleDensityChange('comfortable')}
              className={`rounded-2xl border p-4 text-left transition ${interfaceDensity === 'comfortable' ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-300 bg-base-100 hover:border-primary/50'}`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-base-content">
                <MousePointer2 className="h-4 w-4 text-primary" />
                {isBg ? 'Стандартна плътност' : 'Comfortable density'}
              </p>
              <p className="mt-1 text-xs text-base-content/60">
                {isBg ? 'Повече въздух между елементите и по-спокойно четене.' : 'More spacing between elements for a calmer layout.'}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleDensityChange('compact')}
              className={`rounded-2xl border p-4 text-left transition ${interfaceDensity === 'compact' ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-300 bg-base-100 hover:border-primary/50'}`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-base-content">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                {isBg ? 'Компактна плътност' : 'Compact density'}
              </p>
              <p className="mt-1 text-xs text-base-content/60">
                {isBg ? 'По-стегнат интерфейс с повече съдържание на екрана.' : 'Tighter layout that fits more content on screen.'}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleMotionChange('full')}
              className={`rounded-2xl border p-4 text-left transition ${motionPreference === 'full' ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-300 bg-base-100 hover:border-primary/50'}`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-base-content">
                <Zap className="h-4 w-4 text-primary" />
                {isBg ? 'Стандартни анимации' : 'Standard motion'}
              </p>
              <p className="mt-1 text-xs text-base-content/60">
                {isBg ? 'Запазва текущите преходи и анимирани състояния.' : 'Keeps the current transitions and animated states.'}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleMotionChange('reduced')}
              className={`rounded-2xl border p-4 text-left transition ${motionPreference === 'reduced' ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-300 bg-base-100 hover:border-primary/50'}`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-base-content">
                <PlaySquare className="h-4 w-4 text-primary" />
                {isBg ? 'Намалено движение' : 'Reduced motion'}
              </p>
              <p className="mt-1 text-xs text-base-content/60">
                {isBg ? 'Ограничава анимациите за по-стабилно и спокойно усещане.' : 'Reduces animations for a steadier, calmer experience.'}
              </p>
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-base-300/80 bg-base-100/90 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PanelTop className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-base-content">
                {isBg ? 'Начален екран за ролята' : 'Role start page'}
              </h3>
              <p className="text-sm text-base-content/65">
                {isBg ? 'Определя къде да отива таблото при вход към тази роля.' : 'Controls which page opens first for this dashboard role.'}
              </p>
            </div>
          </div>

          <label className="form-control mt-5 gap-2">
            <span className="label-text text-sm font-semibold text-base-content/80">
              {isBg ? 'Екран по подразбиране' : 'Default landing page'}
            </span>
            <select
              className="select select-bordered h-12 rounded-xl border-base-300 bg-base-100"
              value={currentStartPage}
              onChange={(event) => handleStartPageChange(event.target.value)}
            >
              {startPageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {isBg ? option.labelBg : option.labelEn}
                </option>
              ))}
            </select>
          </label>

          <p className="mt-3 text-xs text-base-content/60">
            {isBg
              ? 'При отваряне на /dashboard ще бъдете насочен към избрания екран.'
              : 'When opening /dashboard you will be redirected to the selected page.'}
          </p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-base-300/80 bg-base-100/90 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Globe className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-base-content">{t.languageTitle}</h3>
              <p className="text-sm text-base-content/65">{t.languageHint}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleLanguageChange('bg')}
              className={`rounded-2xl border p-4 text-left transition ${language === 'bg' ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-300 bg-base-100 hover:border-primary/50'}`}
            >
              <p className="text-sm font-semibold text-base-content">Български</p>
              <p className="mt-1 text-xs text-base-content/60">BG interface, dates, and labels.</p>
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`rounded-2xl border p-4 text-left transition ${language === 'en' ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-300 bg-base-100 hover:border-primary/50'}`}
            >
              <p className="text-sm font-semibold text-base-content">English</p>
              <p className="mt-1 text-xs text-base-content/60">English interface, dates, and labels.</p>
            </button>
          </div>
        </article>

        <article className="rounded-2xl border border-base-300/80 bg-base-100/90 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MoonStar className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-base-content">{t.themeTitle}</h3>
              <p className="text-sm text-base-content/65">{t.themeHint}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => handleThemeChange('system')}
              className={`rounded-2xl border p-4 text-left transition ${themePreference === 'system' ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-300 bg-base-100 hover:border-primary/50'}`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-base-content">
                <Monitor className="h-4 w-4 text-primary" />
                {isBg ? 'Системна' : 'System'}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`rounded-2xl border p-4 text-left transition ${themePreference === 'light' ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-300 bg-base-100 hover:border-primary/50'}`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-base-content">
                <Sun className="h-4 w-4 text-primary" />
                {isBg ? 'Светла' : 'Light'}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`rounded-2xl border p-4 text-left transition ${themePreference === 'dark' ? 'border-primary bg-primary/10 shadow-sm' : 'border-base-300 bg-base-100 hover:border-primary/50'}`}
            >
              <p className="flex items-center gap-2 text-sm font-semibold text-base-content">
                <MoonStar className="h-4 w-4 text-primary" />
                {isBg ? 'Тъмна' : 'Dark'}
              </p>
            </button>
          </div>
        </article>
      </div>
    </section>
  )
}
