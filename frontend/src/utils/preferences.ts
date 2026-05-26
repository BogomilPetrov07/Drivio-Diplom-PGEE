export type ThemePreference = 'system' | 'light' | 'dark'
export type LanguagePreference = 'bg' | 'en'
export type InterfaceDensityPreference = 'comfortable' | 'compact'
export type MotionPreference = 'full' | 'reduced'

export const THEME_PREFERENCE_KEY = 'theme-preference'
export const LANGUAGE_PREFERENCE_KEY = 'language'
export const INTERFACE_DENSITY_PREFERENCE_KEY = 'dashboard-density'
export const MOTION_PREFERENCE_KEY = 'dashboard-motion'
export const DASHBOARD_START_PAGE_KEY_PREFIX = 'dashboard-start-page'
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const escapedName = name.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&')
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function getCookieDomainForCurrentHost(): string | null {
  if (typeof window === 'undefined') return null
  const { hostname } = window.location

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    return null
  }

  const labels = hostname.split('.')
  if (labels.length < 2) return null
  return `${labels[labels.length - 2]}.${labels[labels.length - 1]}`
}

function writeCookie(name: string, value: string, domain?: string) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  const domainPart = domain ? `; Domain=${domain}` : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax${secure}${domainPart}`
}

function deleteCookie(name: string, domain?: string) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  const domainPart = domain ? `; Domain=${domain}` : ''
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${secure}${domainPart}`
}

function writePreferenceCookie(name: string, value: string) {
  const sharedDomain = getCookieDomainForCurrentHost()
  if (sharedDomain) {
    writeCookie(name, value, sharedDomain)
    // Clear any stale host-only cookie that could shadow shared state.
    deleteCookie(name)
    return
  }
  // Local/dev fallback where shared domain cookie is not supported.
  writeCookie(name, value)
}

export function getInitialThemePreference(): ThemePreference {
  if (typeof window === 'undefined') return 'system'
  const fromCookie = readCookie(THEME_PREFERENCE_KEY)
  if (fromCookie === 'light' || fromCookie === 'dark' || fromCookie === 'system') {
    return fromCookie
  }
  return 'system'
}

export function setThemePreference(value: ThemePreference) {
  writePreferenceCookie(THEME_PREFERENCE_KEY, value)
}

export function getThemePreferenceFromCookie(): ThemePreference | null {
  const fromCookie = readCookie(THEME_PREFERENCE_KEY)
  if (fromCookie === 'light' || fromCookie === 'dark' || fromCookie === 'system') {
    return fromCookie
  }
  return null
}

export function getInitialLanguagePreference(): LanguagePreference {
  if (typeof window === 'undefined') return 'bg'
  const fromCookie = readCookie(LANGUAGE_PREFERENCE_KEY)
  if (fromCookie === 'bg' || fromCookie === 'en') {
    return fromCookie
  }
  return 'bg'
}

export function setLanguagePreference(value: LanguagePreference) {
  writePreferenceCookie(LANGUAGE_PREFERENCE_KEY, value)
}

export function getLanguagePreferenceFromCookie(): LanguagePreference | null {
  const fromCookie = readCookie(LANGUAGE_PREFERENCE_KEY)
  if (fromCookie === 'bg' || fromCookie === 'en') {
    return fromCookie
  }
  return null
}

function readLocalPreference(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeLocalPreference(key: string, value: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Ignore localStorage write errors and keep the in-memory state only.
  }
}

export function getInitialInterfaceDensityPreference(): InterfaceDensityPreference {
  const value = readLocalPreference(INTERFACE_DENSITY_PREFERENCE_KEY)
  return value === 'compact' ? 'compact' : 'comfortable'
}

export function setInterfaceDensityPreference(value: InterfaceDensityPreference) {
  writeLocalPreference(INTERFACE_DENSITY_PREFERENCE_KEY, value)
}

export function getInitialMotionPreference(): MotionPreference {
  const value = readLocalPreference(MOTION_PREFERENCE_KEY)
  return value === 'reduced' ? 'reduced' : 'full'
}

export function setMotionPreference(value: MotionPreference) {
  writeLocalPreference(MOTION_PREFERENCE_KEY, value)
}

export function getDashboardStartPageKey(roleSegment: string) {
  return `${DASHBOARD_START_PAGE_KEY_PREFIX}:${roleSegment}`
}

export function getDashboardStartPage(roleSegment: string): string | null {
  const value = readLocalPreference(getDashboardStartPageKey(roleSegment))
  return value && value.startsWith('/dashboard/') ? value : null
}

export function setDashboardStartPage(roleSegment: string, value: string) {
  writeLocalPreference(getDashboardStartPageKey(roleSegment), value)
}
