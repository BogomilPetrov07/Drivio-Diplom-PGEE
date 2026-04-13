import DashboardPlaceholderPage from './DashboardPlaceholderPage'
import type { Language } from '../../../i18n/language'

interface Props { language: Language }

export default function StudentSchedulePage({ language }: Props) {
  return <DashboardPlaceholderPage language={language} titleBg='График' titleEn='Schedule' descBg='Прегледайте предстоящите си уроци.' descEn='Review your upcoming lessons.' />
}
