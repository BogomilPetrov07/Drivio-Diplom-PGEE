import DashboardPlaceholderPage from './DashboardPlaceholderPage'
import type { Language } from '../../../i18n/language'

interface Props { language: Language }

export default function SchoolAdminPeoplePage({ language }: Props) {
  return <DashboardPlaceholderPage language={language} titleBg='Хора' titleEn='People' descBg='Управлявайте екипа и курсистите.' descEn='Manage team members and students.' />
}
