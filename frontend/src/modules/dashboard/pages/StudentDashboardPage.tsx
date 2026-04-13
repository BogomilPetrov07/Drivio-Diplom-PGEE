import RoleHomePage from './RoleHomePage'
import type { Language } from '../../../i18n/language'

interface Props { language: Language }

export default function StudentDashboardPage({ language }: Props) {
  return <RoleHomePage language={language} role='student' />
}
