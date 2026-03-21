import bg from './bg.json'
import en from './en.json'

export type Language = 'bg' | 'en'

const translations = { bg, en } as const

export function getPublicTranslations(language: Language) {
  return translations[language]
}
