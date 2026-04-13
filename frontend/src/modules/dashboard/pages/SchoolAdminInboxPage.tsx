import DashboardPlaceholderPage from './DashboardPlaceholderPage'
import type { Language } from '../../../i18n/language'

interface Props { language: Language }

export default function SchoolAdminInboxPage({ language }: Props) {
  return <DashboardPlaceholderPage language={language} titleBg='Входящи' titleEn='Inbox' descBg='Управлявайте входящите съобщения.' descEn='Manage incoming messages.' />
}
