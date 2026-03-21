import { useState, useEffect } from 'react'
import { Menu, X, Sun, Moon, Globe, Monitor } from 'lucide-react'
import logoLight from '../../../assets/logo_light.svg'
import logoDark from '../../../assets/logo_dark.svg'

interface HeaderProps {
  themePreference: 'system' | 'light' | 'dark'
  resolvedTheme: 'drivio-pro-light' | 'drivio-pro-dark'
  setThemePreference: (theme: 'system' | 'light' | 'dark') => void
  language: 'bg' | 'en'
  setLanguage: (lang: 'bg' | 'en') => void
}

export default function Header({ themePreference, resolvedTheme, setThemePreference, language, setLanguage }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeLink, setActiveLink] = useState('home')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { id: 'home', label: language === 'bg' ? 'Начало' : 'Home', href: '#' },
    { id: 'features', label: language === 'bg' ? 'Функции' : 'Features', href: '#features' },
    { id: 'students', label: language === 'bg' ? 'За курсисти' : 'For Students', href: '#students' },
    { id: 'schools', label: language === 'bg' ? 'За автошколи' : 'For Schools', href: '#schools' },
  ]

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-base-100/95 backdrop-blur-md shadow-lg' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src={resolvedTheme === 'drivio-pro-light' ? logoLight : logoDark}
                alt="Drivio Logo"
                className="h-10 w-auto transition-transform group-hover:scale-105"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight text-primary">
              Drivio
            </span>
          </a>

          {/* Center Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center">
            <div className="flex items-center bg-base-200/50 rounded-full px-2 py-1.5">
              {navLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => setActiveLink(link.id)}
                  className={`relative px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                    activeLink === link.id
                      ? 'bg-base-100 text-base-content shadow-sm'
                      : 'text-base-content/70 hover:text-base-content'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-ghost btn-circle btn-sm" aria-label="Change language">
                <Globe className="w-5 h-5" />
              </button>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-xl shadow-xl w-32 p-2 mt-2 border border-base-content/10">
                <li>
                  <button 
                    onClick={() => setLanguage('bg')} 
                    className={language === 'bg' ? 'active' : ''}
                  >
                    BG
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLanguage('en')} 
                    className={language === 'en' ? 'active' : ''}
                  >
                    EN
                  </button>
                </li>
              </ul>
            </div>

            {/* Theme Switcher */}
            <div className="dropdown dropdown-end">
              <button tabIndex={0} className="btn btn-ghost btn-circle btn-sm" aria-label="Change theme">
                {themePreference === 'system' ? (
                  <Monitor className="w-5 h-5" />
                ) : resolvedTheme === 'drivio-pro-dark' ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </button>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-xl shadow-xl w-44 p-2 mt-2 border border-base-content/10">
                <li>
                  <button onClick={() => setThemePreference('system')} className={themePreference === 'system' ? 'active' : ''}>
                    <Monitor className="w-4 h-4" /> System
                  </button>
                </li>
                <li>
                  <button onClick={() => setThemePreference('light')} className={themePreference === 'light' ? 'active' : ''}>
                    <Sun className="w-4 h-4" /> Light
                  </button>
                </li>
                <li>
                  <button onClick={() => setThemePreference('dark')} className={themePreference === 'dark' ? 'active' : ''}>
                    <Moon className="w-4 h-4" /> Dark
                  </button>
                </li>
              </ul>
            </div>

            {/* Login Button (Desktop) */}
            <a
              href="/login"
              className="btn btn-primary rounded-full px-6 hidden lg:flex"
            >
              {language === 'bg' ? 'Вход' : 'Login'}
            </a>

            {/* Mobile Menu Button */}
            <button
              className="btn btn-ghost btn-circle lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`lg:hidden fixed inset-x-0 top-20 bg-base-100 shadow-xl transition-all duration-300 ${
          mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <nav className="container mx-auto px-6 py-6">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                onClick={() => {
                  setActiveLink(link.id)
                  setMobileMenuOpen(false)
                }}
                className={`text-base font-medium py-3 px-4 rounded-xl transition-colors ${
                  activeLink === link.id
                    ? 'bg-primary text-primary-content'
                    : 'text-base-content/70 hover:bg-base-200'
                }`}
              >
                {link.label}
              </a>
            ))}
          </div>

          <a
            href="/login"
            className="btn btn-primary btn-block rounded-full mt-4"
          >
            {language === 'bg' ? 'Вход' : 'Login'}
          </a>
        </nav>
      </div>
    </header>
  )
}
