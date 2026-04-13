import DashboardPlaceholderPage from './DashboardPlaceholderPage'
import type { Language } from '../../../i18n/language'

interface Props { language: Language }

export default function SchoolAdminCarsPage({ language }: Props) {
  return <DashboardPlaceholderPage language={language} titleBg='Коли' titleEn='Cars' descBg='Управлявайте автопарка на школата.' descEn='Manage your vehicle fleet.' />
}
