import { useEffect, useRef, useState } from 'react'
import { Menu, X, Sun, Moon, Globe, Monitor } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import logoLight from '../../../assets/logo_light.svg'
import logoDark from '../../../assets/logo_dark.svg'
import { getPublicTranslations } from '../../../i18n/public'
import { getDomainAwareUrl } from '../../../utils/app-domain'

interface HeaderProps {
  themePreference: 'system' | 'light' | 'dark'
  resolvedTheme: 'drivio-light' | 'drivio-dark'
  setThemePreference: (theme: 'system' | 'light' | 'dark') => void
  language: 'bg' | 'en'
  setLanguage: (lang: 'bg' | 'en') => void
}

export default function Header({
  themePreference,
  resolvedTheme,
  setThemePreference,
  language,
  setLanguage,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const location = useLocation()

  const languageRef = useRef<HTMLDivElement | null>(null)
  const themeRef = useRef<HTMLDivElement | null>(null)
  const mobileRef = useRef<HTMLDivElement | null>(null)
  const mobileButtonRef = useRef<HTMLButtonElement | null>(null)

  const t = getPublicTranslations(language)
  const header = t.header
  const common = t.common

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (languageRef.current && !languageRef.current.contains(target)) setLanguageOpen(false)
      if (themeRef.current && !themeRef.current.contains(target)) setThemeOpen(false)
      const clickedMobileButton = mobileButtonRef.current?.contains(target) ?? false
      if (!clickedMobileButton && mobileRef.current && !mobileRef.current.contains(target)) setMobileMenuOpen(false)
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLanguageOpen(false)
        setThemeOpen(false)
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      setLanguageOpen(false)
      setThemeOpen(false)
      setMobileMenuOpen(false)
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [location.pathname])

  const navLinks = [
    { id: 'home', label: header.nav.home, href: '/' },
    { id: 'students', label: header.nav.students, href: '/students' },
    { id: 'schools', label: header.nav.schools, href: '/schools' },
  ]
  const homeHref = getDomainAwareUrl('/')
  const loginHref = getDomainAwareUrl('/login')

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-base-200/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          <a href={homeHref} className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src={resolvedTheme === 'drivio-light' ? logoLight : logoDark}
                alt="Drivio Logo"
                className="h-10 w-auto transition-transform group-hover:scale-105"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight text-primary">Drivio</span>
          </a>

          <nav className="hidden lg:flex items-center">
            <div className="flex items-center bg-base-200/50 rounded-full px-2 py-1.5">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href
                return (
                  <Link
                    key={link.id}
                    to={link.href}
                    className={`relative px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                      isActive ? 'bg-base-100 text-base-content shadow-sm' : 'text-base-content/70 hover:text-base-content'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="flex items-center gap-2">
            <div ref={languageRef} className={`dropdown dropdown-end ${languageOpen ? 'dropdown-open' : ''}`}>
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm"
                aria-label={common.changeLanguage}
                onClick={() => {
                  setLanguageOpen((prev) => !prev)
                  setThemeOpen(false)
                }}
              >
                <Globe className="w-5 h-5" />
              </button>
              <ul className="dropdown-content menu bg-base-100 rounded-xl shadow-xl w-32 p-2 mt-2 border border-base-content/10">
                <li><button onClick={() => { setLanguage('bg'); setLanguageOpen(false) }} className={language === 'bg' ? 'active' : ''}>BG</button></li>
                <li><button onClick={() => { setLanguage('en'); setLanguageOpen(false) }} className={language === 'en' ? 'active' : ''}>EN</button></li>
              </ul>
            </div>

            <div ref={themeRef} className={`dropdown dropdown-end ${themeOpen ? 'dropdown-open' : ''}`}>
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm"
                aria-label={common.changeTheme}
                onClick={() => {
                  setThemeOpen((prev) => !prev)
                  setLanguageOpen(false)
                }}
              >
                {themePreference === 'system' ? <Monitor className="w-5 h-5" /> : resolvedTheme === 'drivio-dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <ul className="dropdown-content menu bg-base-100 rounded-xl shadow-xl w-44 p-2 mt-2 border border-base-content/10">
                <li><button onClick={() => { setThemePreference('system'); setThemeOpen(false) }} className={themePreference === 'system' ? 'active' : ''}><Monitor className="w-4 h-4" /> {common.themeSystem}</button></li>
                <li><button onClick={() => { setThemePreference('light'); setThemeOpen(false) }} className={themePreference === 'light' ? 'active' : ''}><Sun className="w-4 h-4" /> {common.themeLight}</button></li>
                <li><button onClick={() => { setThemePreference('dark'); setThemeOpen(false) }} className={themePreference === 'dark' ? 'active' : ''}><Moon className="w-4 h-4" /> {common.themeDark}</button></li>
              </ul>
            </div>

            <a href={loginHref} className="btn btn-primary rounded-full px-6 hidden lg:flex">
              {header.login}
            </a>

            <div className="lg:hidden">
              <button
                ref={mobileButtonRef}
                type="button"
                className="btn btn-ghost btn-circle"
                onClick={(event) => {
                  event.stopPropagation()
                  setMobileMenuOpen((prev) => !prev)
                }}
                aria-label={header.toggleMenu}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={mobileRef}
        onClick={(event) => event.stopPropagation()}
        className={`lg:hidden fixed inset-x-0 top-20 border-t border-base-content/20 bg-base-100/98 backdrop-blur-md shadow-2xl transition-all duration-200 ${
          mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <nav className="container mx-auto px-6 py-6">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href
              return (
                <Link
                  key={link.id}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-base font-medium py-3 px-4 rounded-xl transition-colors ${
                    isActive ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
          <a href={loginHref} className="btn btn-primary btn-block rounded-full mt-4" onClick={() => setMobileMenuOpen(false)}>
            {header.login}
          </a>
        </nav>
      </div>
    </header>
  )
}
