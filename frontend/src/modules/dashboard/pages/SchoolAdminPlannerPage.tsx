import DashboardPlaceholderPage from './DashboardPlaceholderPage'
import type { Language } from '../../../i18n/language'

interface Props { language: Language }

export default function SchoolAdminPlannerPage({ language }: Props) {
  return <DashboardPlaceholderPage language={language} titleBg='Планер' titleEn='Planner' descBg='Организирайте графици и задачи.' descEn='Organize schedules and tasks.' />
}
