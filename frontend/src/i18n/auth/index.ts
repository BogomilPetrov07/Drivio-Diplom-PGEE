import bg from './bg.json'
import en from './en.json'
import type { Language } from '../language'

const translations = { bg, en } as const

export function getAuthTranslations(language: Language) {
  return translations[language]
}

