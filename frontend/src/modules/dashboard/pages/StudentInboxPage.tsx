import DashboardPlaceholderPage from './DashboardPlaceholderPage'
import type { Language } from '../../../i18n/language'

interface Props { language: Language }

export default function StudentInboxPage({ language }: Props) {
  return <DashboardPlaceholderPage language={language} titleBg='Входящи' titleEn='Inbox' descBg='Вашите лични и системни съобщения.' descEn='Your personal and system messages.' />
}
