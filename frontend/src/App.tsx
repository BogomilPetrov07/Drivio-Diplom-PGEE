import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { Language } from './i18n/public'
import Header from './modules/public/components/Header'
import AuthHeader from './modules/public/components/AuthHeader'
import AuthnGuard from './modules/auth/components/AuthnGuard'
import AuthzGuard from './modules/auth/components/AuthzGuard'
import DashboardHomeRedirect from './modules/dashboard/pages/DashboardHomeRedirect'
import SuperAdminLayout from './modules/dashboard/pages/SuperAdminLayout'
import SuperAdminHomePage from './modules/dashboard/pages/SuperAdminHomePage'
import SuperAdminStatisticsPage from './modules/dashboard/pages/SuperAdminStatisticsPage'
import SuperAdminRequestsPage from './modules/dashboard/pages/SuperAdminRequestsPage'
import SuperAdminSupportPage from './modules/dashboard/pages/SuperAdminSupportPage'
import SchoolAdminLayout from './modules/dashboard/pages/SchoolAdminLayout'
import InstructorDashboardPage from './modules/dashboard/pages/InstructorDashboardPage'
import InstructorLayout from './modules/dashboard/pages/InstructorLayout'
import InstructorInboxPage from './modules/dashboard/pages/InstructorInboxPage'
import InstructorSchedulePage from './modules/dashboard/pages/InstructorSchedulePage'
import InstructorStudentsPage from './modules/dashboard/pages/InstructorStudentsPage'
import SchoolAdminDashboardPage from './modules/dashboard/pages/SchoolAdminDashboardPage'
import SchoolAdminInboxPage from './modules/dashboard/pages/SchoolAdminInboxPage'
import SchoolAdminPeoplePage from './modules/dashboard/pages/SchoolAdminPeoplePage'
import SchoolAdminPlannerPage from './modules/dashboard/pages/SchoolAdminPlannerPage'
import SchoolAdminCarsPage from './modules/dashboard/pages/SchoolAdminCarsPage'
import SchoolAdminSupportPage from './modules/dashboard/pages/SchoolAdminSupportPage'
import StudentLayout from './modules/dashboard/pages/StudentLayout'
import StudentSupportPage from './modules/dashboard/pages/StudentSupportPage'
import StudentInboxPage from './modules/dashboard/pages/StudentInboxPage'
import StudentInstructorsPage from './modules/dashboard/pages/StudentInstructorsPage'
import StudentProgressPage from './modules/dashboard/pages/StudentProgressPage'
import StudentSchedulePage from './modules/dashboard/pages/StudentSchedulePage'
import InstructorSupportPage from './modules/dashboard/pages/InstructorSupportPage'
import StudentDashboardPage from './modules/dashboard/pages/StudentDashboardPage'
import UnauthorizedPage from './modules/dashboard/pages/UnauthorizedPage'
import DashboardProfilePage from './modules/dashboard/pages/DashboardProfilePage'
import DashboardSettingsPage from './modules/dashboard/pages/DashboardSettingsPage'
import DashboardNotificationsPage from './modules/dashboard/pages/DashboardNotificationsPage'
import DashboardSecurityPage from './modules/dashboard/pages/DashboardSecurityPage'
import DashboardFaqsPage from './modules/dashboard/pages/DashboardFaqsPage'
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
                <SuperAdminLayout
                  language={language}
                  setLanguage={setLanguage}
                  themePreference={themePreference}
                  resolvedTheme={resolvedTheme}
                  setThemePreference={setThemePreference}
                />
              }
            >
              <Route index element={<Navigate to="/dashboard/superadmin/home" replace />} />
              <Route path="home" element={<SuperAdminHomePage language={language} />} />
              <Route path="statistics" element={<SuperAdminStatisticsPage language={language} />} />
              <Route path="requests" element={<SuperAdminRequestsPage language={language} />} />
              <Route path="support" element={<SuperAdminSupportPage language={language} />} />
              <Route path="profile" element={<DashboardProfilePage language={language} />} />
              <Route path="settings" element={<DashboardSettingsPage language={language} />} />
              <Route path="notifications" element={<DashboardNotificationsPage language={language} />} />
              <Route path="security" element={<DashboardSecurityPage language={language} />} />
              <Route path="faqs" element={<DashboardFaqsPage language={language} />} />
            </Route>
          </Route>

          <Route element={<AuthzGuard allowedRoles={['SCHOOLADMIN']} />}>
            <Route
              path="/dashboard/schooladmin"
              element={
                <SchoolAdminLayout
                  language={language}
                  setLanguage={setLanguage}
                  themePreference={themePreference}
                  resolvedTheme={resolvedTheme}
                  setThemePreference={setThemePreference}
                />
              }
            >
              <Route index element={<Navigate to="/dashboard/schooladmin/home" replace />} />
              <Route path="home" element={<SchoolAdminDashboardPage language={language} />} />
              <Route path="inbox" element={<SchoolAdminInboxPage language={language} />} />
              <Route path="people" element={<SchoolAdminPeoplePage language={language} />} />
              <Route path="planner" element={<SchoolAdminPlannerPage language={language} />} />
              <Route path="cars" element={<SchoolAdminCarsPage language={language} />} />
              <Route path="support" element={<SchoolAdminSupportPage language={language} />} />
              <Route path="profile" element={<DashboardProfilePage language={language} />} />
              <Route path="settings" element={<DashboardSettingsPage language={language} />} />
              <Route path="notifications" element={<DashboardNotificationsPage language={language} />} />
              <Route path="security" element={<DashboardSecurityPage language={language} />} />
              <Route path="faqs" element={<DashboardFaqsPage language={language} />} />
            </Route>
          </Route>

          <Route element={<AuthzGuard allowedRoles={['INSTRUCTOR']} />}>
            <Route
              path="/dashboard/instructor"
              element={
                <InstructorLayout
                  language={language}
                  setLanguage={setLanguage}
                  themePreference={themePreference}
                  resolvedTheme={resolvedTheme}
                  setThemePreference={setThemePreference}
                />
              }
            >
              <Route index element={<Navigate to="/dashboard/instructor/home" replace />} />
              <Route path="home" element={<InstructorDashboardPage language={language} />} />
              <Route path="inbox" element={<InstructorInboxPage language={language} />} />
              <Route path="schedule" element={<InstructorSchedulePage language={language} />} />
              <Route path="students" element={<InstructorStudentsPage language={language} />} />
              <Route path="support" element={<InstructorSupportPage language={language} />} />
              <Route path="profile" element={<DashboardProfilePage language={language} />} />
              <Route path="settings" element={<DashboardSettingsPage language={language} />} />
              <Route path="notifications" element={<DashboardNotificationsPage language={language} />} />
              <Route path="security" element={<DashboardSecurityPage language={language} />} />
              <Route path="faqs" element={<DashboardFaqsPage language={language} />} />
            </Route>
          </Route>

          <Route element={<AuthzGuard allowedRoles={['STUDENT']} />}>
            <Route
              path="/dashboard/student"
              element={
                <StudentLayout
                  language={language}
                  setLanguage={setLanguage}
                  themePreference={themePreference}
                  resolvedTheme={resolvedTheme}
                  setThemePreference={setThemePreference}
                />
              }
            >
              <Route index element={<Navigate to="/dashboard/student/home" replace />} />
              <Route path="home" element={<StudentDashboardPage language={language} />} />
              <Route path="inbox" element={<StudentInboxPage language={language} />} />
              <Route path="instructors" element={<StudentInstructorsPage language={language} />} />
              <Route path="progress" element={<StudentProgressPage language={language} />} />
              <Route path="schedule" element={<StudentSchedulePage language={language} />} />
              <Route path="support" element={<StudentSupportPage language={language} />} />
              <Route path="profile" element={<DashboardProfilePage language={language} />} />
              <Route path="settings" element={<DashboardSettingsPage language={language} />} />
              <Route path="notifications" element={<DashboardNotificationsPage language={language} />} />
              <Route path="security" element={<DashboardSecurityPage language={language} />} />
              <Route path="faqs" element={<DashboardFaqsPage language={language} />} />
            </Route>
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
