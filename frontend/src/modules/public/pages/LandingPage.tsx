import {useEffect, useState} from 'react'
import CookieConsent from '../components/CookieBanner.js' // 1. Import the component
import Features from '../components/Features'
import Footer from '../components/Footer'
import ForSchools from '../components/ForSchools'
import ForStudents from '../components/ForStudents'
import Header from '../components/Header'
import Hero from '../components/Hero'

type Theme = 'drivio-pro-light' | 'drivio-pro-dark'
type ThemePreference = 'system' | 'light' | 'dark'
type Language = 'bg' | 'en'
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

export default function LandingPage() {
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
            if (themePreference === 'system') {
                applyTheme()
            }
        }

        media.addEventListener('change', handleMediaChange)
        return () => media.removeEventListener('change', handleMediaChange)
    }, [themePreference])

    useEffect(() => {
        localStorage.setItem('language', language)
    }, [language])

    return (
        <div className="min-h-screen bg-base-100">
            <Header
                themePreference={themePreference}
                resolvedTheme={resolvedTheme}
                setThemePreference={setThemePreference}
                language={language}
                setLanguage={setLanguage}
            />
            <main>
                <Hero language={language}/>
                <Features/>
                <ForStudents/>
                <ForSchools/>
            </main>
            <Footer theme={resolvedTheme}/>

            {/* 2. Add the component here */}
            <CookieConsent/>
        </div>
    )
}
