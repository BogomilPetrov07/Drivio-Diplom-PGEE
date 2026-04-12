export type ThemePreference = 'system' | 'light' | 'dark'
export type LanguagePreference = 'bg' | 'en'

export const THEME_PREFERENCE_KEY = 'theme-preference'
export const LANGUAGE_PREFERENCE_KEY = 'language'
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
    return 'localhost'
  }

  const labels = hostname.split('.')
  if (labels.length < 2) return null
  return `${labels[labels.length - 2]}.${labels[labels.length - 1]}`
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  const domain = getCookieDomainForCurrentHost()
  const domainPart = domain ? `; Domain=${domain}` : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${ONE_YEAR_SECONDS}; Path=/; SameSite=Lax${secure}${domainPart}`
}

export function getInitialThemePreference(): ThemePreference {
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

export function setThemePreference(value: ThemePreference) {
  localStorage.setItem(THEME_PREFERENCE_KEY, value)
  writeCookie(THEME_PREFERENCE_KEY, value)
}

export function getInitialLanguagePreference(): LanguagePreference {
  if (typeof window === 'undefined') return 'bg'
  const saved = localStorage.getItem(LANGUAGE_PREFERENCE_KEY)
  if (saved === 'bg' || saved === 'en') return saved
  const fromCookie = readCookie(LANGUAGE_PREFERENCE_KEY)
  if (fromCookie === 'bg' || fromCookie === 'en') {
    localStorage.setItem(LANGUAGE_PREFERENCE_KEY, fromCookie)
    return fromCookie
  }
  return 'bg'
}

export function setLanguagePreference(value: LanguagePreference) {
  localStorage.setItem(LANGUAGE_PREFERENCE_KEY, value)
  writeCookie(LANGUAGE_PREFERENCE_KEY, value)
}

