import { getLanguagePreferenceFromCookie, getThemePreferenceFromCookie } from './preferences'

const AUTH_LABEL = 'app'
const PREF_LANGUAGE_PARAM = '__pref_lang'
const PREF_THEME_PARAM = '__pref_theme'

export function isAuthPath(pathname: string) {
  return (
    pathname === '/session-check' ||
    pathname === '/login' ||
    pathname.startsWith('/register') ||
    pathname === '/unauthorized' ||
    pathname.startsWith('/dashboard')
  )
}

function isLocalhostHost(hostname: string) {
  return hostname === 'localhost' || hostname.endsWith('.localhost')
}

export function getAppHostname(currentHostname: string) {
  if (isLocalhostHost(currentHostname)) {
    // In local development keep a single host to avoid host-only cookie fragmentation.
    return currentHostname
  }

  const labels = currentHostname.split('.')
  if (labels.includes(AUTH_LABEL)) return currentHostname

  // Insert auth label before the registrable domain (last 2 labels).
  labels.splice(Math.max(labels.length - 2, 0), 0, AUTH_LABEL)
  return labels.join('.')
}

export function getBaseHostname(currentHostname: string) {
  if (isLocalhostHost(currentHostname)) {
    // Keep localhost hosts stable in dev.
    return currentHostname
  }

  const labels = currentHostname.split('.')
  const authIdx = labels.indexOf(AUTH_LABEL)
  if (authIdx !== -1) labels.splice(authIdx, 1)

  const baseHostname = labels.join('.')
  if (baseHostname === '') return currentHostname
  return baseHostname
}

export function getDomainAwareUrl(path: string) {
  if (typeof window === 'undefined') return path

  const targetUrl = new URL(window.location.href)
  const targetHostname = isAuthPath(path)
    ? getAppHostname(window.location.hostname)
    : getBaseHostname(window.location.hostname)
  targetUrl.hostname = targetHostname
  targetUrl.pathname = path
  targetUrl.search = ''
  targetUrl.hash = ''
  attachCrossDomainPreferenceParams(targetUrl, targetHostname)

  return targetUrl.toString()
}

export function ensureCorrectDomainForPath(pathname: string) {
  if (typeof window === 'undefined') return

  const targetHostname = isAuthPath(pathname)
    ? getAppHostname(window.location.hostname)
    : getBaseHostname(window.location.hostname)

  if (window.location.hostname === targetHostname) return

  const targetUrl = new URL(window.location.href)
  targetUrl.hostname = targetHostname
  attachCrossDomainPreferenceParams(targetUrl, targetHostname)
  window.location.replace(targetUrl.toString())
}

function attachCrossDomainPreferenceParams(targetUrl: URL, targetHostname: string) {
  if (typeof window === 'undefined') return
  if (isLocalhostHost(window.location.hostname)) return
  if (window.location.hostname === targetHostname) return

  const language = getLanguagePreferenceFromCookie()
  const theme = getThemePreferenceFromCookie()

  if (language === 'bg' || language === 'en') {
    targetUrl.searchParams.set(PREF_LANGUAGE_PARAM, language)
  }

  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    targetUrl.searchParams.set(PREF_THEME_PARAM, theme)
  }
}
