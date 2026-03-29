function isAuthPath(pathname: string) {
  return (
    pathname === '/login' ||
    pathname.startsWith('/register') ||
    pathname === '/unauthorized' ||
    pathname.startsWith('/dashboard')
  )
}

export function getAppHostname(currentHostname: string) {
  if (currentHostname === 'localhost') return 'app.localhost'
  if (currentHostname === 'app.localhost') return currentHostname
  if (currentHostname.endsWith('.localhost')) return 'app.localhost'
  if (currentHostname.startsWith('app.')) return currentHostname
  return `app.${currentHostname}`
}

export function getBaseHostname(currentHostname: string) {
  if (currentHostname === 'app.localhost') return 'localhost'
  if (currentHostname.startsWith('app.')) return currentHostname.slice(4)
  return currentHostname
}

export function getAppUrl(path: string) {
  if (typeof window === 'undefined') return path

  const targetUrl = new URL(window.location.href)
  targetUrl.hostname = getAppHostname(window.location.hostname)
  targetUrl.pathname = path
  targetUrl.search = ''
  targetUrl.hash = ''

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
  window.location.replace(targetUrl.toString())
}
