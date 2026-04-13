import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom'
import type { Language } from './i18n/public'
import Header from './modules/public/components/Header'
import AuthHeader from './modules/public/components/AuthHeader'
import AuthnGuard from './modules/auth/components/AuthnGuard'
import AuthzGuard from './modules/auth/components/AuthzGuard'
import DashboardHomeRedirect from './modules/dashboard/pages/DashboardHomeRedirect'
import InstructorDashboardPage from './modules/dashboard/pages/InstructorDashboardPage'
import SchoolAdminDashboardPage from './modules/dashboard/pages/SchoolAdminDashboardPage'
import StudentDashboardPage from './modules/dashboard/pages/StudentDashboardPage'
import SuperAdminDashboardPage from './modules/dashboard/pages/SuperAdminDashboardPage'
import UnauthorizedPage from './modules/dashboard/pages/UnauthorizedPage'
import ScrollToTop from './modules/public/components/ScrollToTop'
import LandingPage from './modules/public/pages/LandingPage'
import LoginPage from './modules/auth/pages/LoginPage.js'
import DrivingSchoolRegisterPage from './modules/auth/pages/DrivingSchoolRegisterPage'
import DrivingSchoolCompleteSetupPage from './modules/auth/pages/DrivingSchoolCompleteSetupPage'
import PrivacyPage from './modules/public/pages/PrivacyPage'
import SchoolsPage from './modules/public/pages/SchoolsPage'
import StudentsPage from './modules/public/pages/StudentsPage'
import TermsPage from './modules/public/pages/TermsPage'
import { ensureCorrectDomainForPath } from './utils/app-domain'
import {
  getInitialLanguagePreference,
  getLanguagePreferenceFromCookie,
  getInitialThemePreference,
  getThemePreferenceFromCookie,
  setLanguagePreference as persistLanguagePreference,
  setThemePreference as persistThemePreference,
  type ThemePreference,
} from './utils/preferences'

type Theme = 'drivio-light' | 'drivio-dark'

function readTransferredPreferencesFromUrl() {
  if (typeof window === 'undefined') {
    return { language: null as Language | null, theme: null as ThemePreference | null }
  }

  const url = new URL(window.location.href)
  const languageParam = url.searchParams.get('__pref_lang')
  const themeParam = url.searchParams.get('__pref_theme')

  const language: Language | null = languageParam === 'bg' || languageParam === 'en' ? languageParam : null
  const theme: ThemePreference | null =
    themeParam === 'light' || themeParam === 'dark' || themeParam === 'system' ? themeParam : null

  return { language, theme }
}

function DomainGuard() {
  const location = useLocation()

  useEffect(() => {
    ensureCorrectDomainForPath(location.pathname)
  }, [location.pathname])

  return null
}

interface AppRoutesProps {
  themePreference: ThemePreference
  resolvedTheme: Theme
  setThemePreference: (theme: ThemePreference) => void
  language: Language
  setLanguage: (language: Language) => void
}

function AppRoutes({
  themePreference,
  resolvedTheme,
  setThemePreference,
  language,
  setLanguage,
}: AppRoutesProps) {
  const location = useLocation()
  const isPublicLayoutRoute = ['/', '/students', '/schools', '/privacy', '/terms'].includes(location.pathname)
  const isAuthLayoutRoute = ['/login', '/register', '/register/driving-school', '/register/driving-school/complete'].includes(location.pathname)

  return (
    <div className="min-h-screen bg-base-100">
      {isPublicLayoutRoute ? (
        <Header
          themePreference={themePreference}
          resolvedTheme={resolvedTheme}
          setThemePreference={setThemePreference}
          language={language}
          setLanguage={setLanguage}
        />
      ) : isAuthLayoutRoute ? (
        <AuthHeader
          themePreference={themePreference}
          resolvedTheme={resolvedTheme}
          setThemePreference={setThemePreference}
          language={language}
          setLanguage={setLanguage}
        />
      ) : null}

      <Routes>
        <Route path="/" element={<LandingPage language={language} theme={resolvedTheme} />} />
        <Route path="/students" element={<StudentsPage language={language} theme={resolvedTheme} />} />
        <Route path="/schools" element={<SchoolsPage language={language} theme={resolvedTheme} />} />
        <Route path="/login" element={<LoginPage language={language} />} />
        <Route path="/register" element={<DrivingSchoolRegisterPage language={language} />} />
        <Route path="/register/driving-school" element={<DrivingSchoolRegisterPage language={language} />} />
        <Route path="/register/driving-school/complete" element={<DrivingSchoolCompleteSetupPage language={language} />} />
        <Route path="/privacy" element={<PrivacyPage language={language} theme={resolvedTheme} />} />
        <Route path="/terms" element={<TermsPage language={language} theme={resolvedTheme} />} />
        <Route path="/unauthorized" element={<UnauthorizedPage language={language} />} />

        <Route element={<AuthnGuard />}>
          <Route path="/dashboard" element={<DashboardHomeRedirect />} />

          <Route element={<AuthzGuard allowedRoles={['SUPERADMIN']} />}>
            <Route
              path="/dashboard/superadmin"
              element={
                <SuperAdminDashboardPage
                  language={language}
                  setLanguage={setLanguage}
                  themePreference={themePreference}
                  resolvedTheme={resolvedTheme}
                  setThemePreference={setThemePreference}
                />
              }
            />
          </Route>

          <Route element={<AuthzGuard allowedRoles={['SCHOOLADMIN']} />}>
            <Route
              path="/dashboard/school-admin"
              element={
                <SchoolAdminDashboardPage
                  language={language}
                  setLanguage={setLanguage}
                  themePreference={themePreference}
                  resolvedTheme={resolvedTheme}
                  setThemePreference={setThemePreference}
                />
              }
            />
          </Route>

          <Route element={<AuthzGuard allowedRoles={['INSTRUCTOR']} />}>
            <Route
              path="/dashboard/instructor"
              element={
                <InstructorDashboardPage
                  language={language}
                  setLanguage={setLanguage}
                  themePreference={themePreference}
                  resolvedTheme={resolvedTheme}
                  setThemePreference={setThemePreference}
                />
              }
            />
          </Route>

          <Route element={<AuthzGuard allowedRoles={['STUDENT']} />}>
            <Route
              path="/dashboard/student"
              element={
                <StudentDashboardPage
                  language={language}
                  setLanguage={setLanguage}
                  themePreference={themePreference}
                  resolvedTheme={resolvedTheme}
                  setThemePreference={setThemePreference}
                />
              }
            />
          </Route>
        </Route>
      </Routes>
    </div>
  )
}

export default function App() {
  const transferredPrefs = readTransferredPreferencesFromUrl()
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(() => transferredPrefs.theme ?? getInitialThemePreference())
  const [resolvedTheme, setResolvedTheme] = useState<Theme>('drivio-light')
  const [language, setLanguageState] = useState<Language>(() => transferredPrefs.language ?? getInitialLanguagePreference())

  const setThemePreference = (next: ThemePreference) => {
    setThemePreferenceState(next)
    persistThemePreference(next)
  }

  const setLanguage = (next: Language) => {
    setLanguageState(next)
    persistLanguagePreference(next)
  }

  useEffect(() => {
    const url = new URL(window.location.href)
    let changed = false

    if (transferredPrefs.language) {
      setLanguageState(transferredPrefs.language)
      persistLanguagePreference(transferredPrefs.language)
      changed = true
    }

    if (transferredPrefs.theme) {
      setThemePreferenceState(transferredPrefs.theme)
      persistThemePreference(transferredPrefs.theme)
      changed = true
    }

    if (changed) {
      url.searchParams.delete('__pref_lang')
      url.searchParams.delete('__pref_theme')
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`)
    }
  }, [transferredPrefs.language, transferredPrefs.theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const computeTheme = (): Theme => {
      if (themePreference === 'light') return 'drivio-light'
      if (themePreference === 'dark') return 'drivio-dark'
      return media.matches ? 'drivio-dark' : 'drivio-light'
    }

    const applyTheme = () => {
      const nextTheme = computeTheme()
      setResolvedTheme(nextTheme)
      document.documentElement.setAttribute('data-theme', nextTheme)
      document.documentElement.style.colorScheme = nextTheme === 'drivio-dark' ? 'dark' : 'light'
    }

    applyTheme()

    const handleMediaChange = () => {
      if (themePreference === 'system') applyTheme()
    }
    media.addEventListener('change', handleMediaChange)
    return () => media.removeEventListener('change', handleMediaChange)
  }, [themePreference])

  useEffect(() => {
    const syncFromCookie = () => {
      const cookieTheme = getThemePreferenceFromCookie()
      if (cookieTheme && cookieTheme !== themePreference) {
        setThemePreferenceState(cookieTheme)
      }

      const cookieLanguage = getLanguagePreferenceFromCookie()
      if (cookieLanguage && cookieLanguage !== language) {
        setLanguageState(cookieLanguage)
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncFromCookie()
      }
    }

    window.addEventListener('focus', syncFromCookie)
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.removeEventListener('focus', syncFromCookie)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [themePreference, language])

  return (
    <Router>
      <DomainGuard />
      <ScrollToTop />
      <AppRoutes
        themePreference={themePreference}
        resolvedTheme={resolvedTheme}
        setThemePreference={setThemePreference}
        language={language}
        setLanguage={setLanguage}
      />
    </Router>
  )
}
