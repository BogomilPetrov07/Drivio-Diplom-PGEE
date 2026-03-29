import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom'
import type { Language } from './i18n/public'
import Header from './modules/public/components/Header'
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
import PrivacyPage from './modules/public/pages/PrivacyPage'
import SchoolsPage from './modules/public/pages/SchoolsPage'
import StudentsPage from './modules/public/pages/StudentsPage'
import TermsPage from './modules/public/pages/TermsPage'
import { ensureCorrectDomainForPath } from './utils/app-domain'

type Theme = 'drivio-pro-light' | 'drivio-pro-dark'
type ThemePreference = 'system' | 'light' | 'dark'

const THEME_PREFERENCE_KEY = 'theme-preference'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const escapedName = name.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function persistThemePreference(value: ThemePreference) {
  localStorage.setItem(THEME_PREFERENCE_KEY, value)
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${THEME_PREFERENCE_KEY}=${encodeURIComponent(value)}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax${secure}`
}

function getInitialThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const saved = localStorage.getItem(THEME_PREFERENCE_KEY)
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  const fromCookie = readCookie(THEME_PREFERENCE_KEY)
  if (fromCookie === 'light' || fromCookie === 'dark' || fromCookie === 'system') {
    localStorage.setItem(THEME_PREFERENCE_KEY, fromCookie)
    return fromCookie
  }
  return 'system'
}

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'bg'
  const saved = localStorage.getItem('language')
  if (saved === 'bg' || saved === 'en') return saved
  return 'bg'
}

function DomainGuard() {
  const location = useLocation()

  useEffect(() => {
    ensureCorrectDomainForPath(location.pathname)
  }, [location.pathname])

  return null
}

export default function App() {
  const [themePreference, setThemePreference] = useState<ThemePreference>(getInitialThemePreference)
  const [resolvedTheme, setResolvedTheme] = useState<Theme>('drivio-pro-light')
  const [language, setLanguage] = useState<Language>(getInitialLanguage)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const computeTheme = (): Theme => {
      if (themePreference === 'light') return 'drivio-pro-light'
      if (themePreference === 'dark') return 'drivio-pro-dark'
      return media.matches ? 'drivio-pro-dark' : 'drivio-pro-light'
    }

    const applyTheme = () => {
      const nextTheme = computeTheme()
      setResolvedTheme(nextTheme)
      document.documentElement.setAttribute('data-theme', nextTheme)
      document.documentElement.style.colorScheme = nextTheme === 'drivio-pro-dark' ? 'dark' : 'light'
    }

    applyTheme()
    persistThemePreference(themePreference)

    const handleMediaChange = () => {
      if (themePreference === 'system') applyTheme()
    }
    media.addEventListener('change', handleMediaChange)
    return () => media.removeEventListener('change', handleMediaChange)
  }, [themePreference])

  useEffect(() => {
    localStorage.setItem('language', language)
  }, [language])

  return (
    <Router>
      <DomainGuard />
      <ScrollToTop />
      <div className="min-h-screen bg-base-100">
        <Header
          themePreference={themePreference}
          resolvedTheme={resolvedTheme}
          setThemePreference={setThemePreference}
          language={language}
          setLanguage={setLanguage}
        />
        <Routes>
          <Route path="/" element={<LandingPage language={language} theme={resolvedTheme} />} />
          <Route path="/students" element={<StudentsPage language={language} theme={resolvedTheme} />} />
          <Route path="/schools" element={<SchoolsPage language={language} theme={resolvedTheme} />} />
          <Route path="/login" element={<LoginPage language={language} />} />
          <Route path="/privacy" element={<PrivacyPage language={language} theme={resolvedTheme} />} />
          <Route path="/terms" element={<TermsPage language={language} theme={resolvedTheme} />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          <Route element={<AuthnGuard />}>
            <Route path="/dashboard" element={<DashboardHomeRedirect />} />

            <Route element={<AuthzGuard allowedRoles={['SUPERADMIN']} />}>
              <Route path="/dashboard/superadmin" element={<SuperAdminDashboardPage />} />
            </Route>

            <Route element={<AuthzGuard allowedRoles={['SCHOOLADMIN']} />}>
              <Route path="/dashboard/school-admin" element={<SchoolAdminDashboardPage />} />
            </Route>

            <Route element={<AuthzGuard allowedRoles={['INSTRUCTOR']} />}>
              <Route path="/dashboard/instructor" element={<InstructorDashboardPage />} />
            </Route>

            <Route element={<AuthzGuard allowedRoles={['STUDENT']} />}>
              <Route path="/dashboard/student" element={<StudentDashboardPage />} />
            </Route>
          </Route>
        </Routes>
      </div>
    </Router>
  )
}
