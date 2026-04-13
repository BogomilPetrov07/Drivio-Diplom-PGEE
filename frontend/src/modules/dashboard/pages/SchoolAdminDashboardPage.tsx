import RoleHomePage from './RoleHomePage'
import type { Language } from '../../../i18n/language'

interface Props { language: Language }

export default function SchoolAdminDashboardPage({ language }: Props) {
  return <RoleHomePage language={language} role='schoolAdmin' />
}
