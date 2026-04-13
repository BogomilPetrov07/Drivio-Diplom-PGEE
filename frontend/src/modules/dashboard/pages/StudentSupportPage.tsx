import SupportContactCard from '../components/SupportContactCard'
import type { Language } from '../../../i18n/language'

interface Props { language: Language }

export default function StudentSupportPage({ language }: Props) {
  return <SupportContactCard language={language} />
}
