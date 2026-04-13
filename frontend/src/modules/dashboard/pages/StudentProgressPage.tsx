import DashboardPlaceholderPage from './DashboardPlaceholderPage'
import type { Language } from '../../../i18n/language'

interface Props { language: Language }

export default function StudentProgressPage({ language }: Props) {
  return <DashboardPlaceholderPage language={language} titleBg='Прогрес' titleEn='Progress' descBg='Следете обучението и напредъка си.' descEn='Track your learning progress.' />
}
