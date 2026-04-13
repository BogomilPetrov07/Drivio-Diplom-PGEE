import DashboardPlaceholderPage from './DashboardPlaceholderPage'
import type { Language } from '../../../i18n/language'

interface Props { language: Language }

export default function StudentInstructorsPage({ language }: Props) {
  return <DashboardPlaceholderPage language={language} titleBg='Инструктори' titleEn='Instructors' descBg='Вижте вашите инструктори и контактите им.' descEn='See your assigned instructors and contacts.' />
}
