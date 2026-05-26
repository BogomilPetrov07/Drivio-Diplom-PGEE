import { KeyRound, ShieldCheck, UserCog, UserLock } from 'lucide-react'
import type { Language } from '../../../i18n/language'
import { useAuth } from '../../auth/hooks'

interface Props {
  language: Language
}

function getRoleLabel(role: string, language: Language) {
  const isBg = language === 'bg'
  const labels: Record<string, string> = {
    SUPERADMIN: isBg ? 'Супер администратор' : 'Super admin',
    SCHOOLADMIN: isBg ? 'Администратор на школа' : 'School admin',
    INSTRUCTOR: isBg ? 'Инструктор' : 'Instructor',
    STUDENT: isBg ? 'Курсист' : 'Student',
  }
  return labels[role] ?? role
}

export default function DashboardSecurityPage({ language }: Props) {
  const isBg = language === 'bg'
  const { user } = useAuth()
  const roles = user?.roles?.length ? user.roles : user?.role ? [user.role] : []

  return (
    <section className="space-y-4 rounded-2xl border border-base-300/70 bg-gradient-to-b from-base-100 to-base-200/60 p-4 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.8)] sm:p-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-base-content sm:text-2xl">
          {isBg ? 'Сигурност' : 'Security'}
        </h2>
        <p className="mt-1 text-sm text-base-content/70">
          {isBg
            ? 'Реален преглед на това как е защитен текущият достъп до платформата.'
            : 'A live overview of how the current platform access is protected.'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-xl border border-base-300 bg-base-100 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-base-content">
            <UserLock className="h-4 w-4 text-primary" />
            {isBg ? 'Активна роля' : 'Active role'}
          </p>
          <p className="mt-2 text-sm font-semibold text-base-content">
            {user?.role ? getRoleLabel(user.role, language) : '-'}
          </p>
          <p className="mt-1 text-xs text-base-content/60">
            {isBg
              ? 'Тази роля определя до кои секции и действия имате достъп в момента.'
              : 'This role determines which sections and actions are currently available.'}
          </p>
        </article>

        <article className="rounded-xl border border-base-300 bg-base-100 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-base-content">
            <UserCog className="h-4 w-4 text-primary" />
            {isBg ? 'Налични роли' : 'Available roles'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {roles.length === 0 ? (
              <span className="text-sm text-base-content/60">-</span>
            ) : (
              roles.map((role) => (
                <span key={role} className="badge badge-outline border-base-300 bg-base-100 px-3 py-2 text-xs font-medium">
                  {getRoleLabel(role, language)}
                </span>
              ))
            )}
          </div>
        </article>

        <article className="rounded-xl border border-base-300 bg-base-100 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-base-content">
            <KeyRound className="h-4 w-4 text-primary" />
            {isBg ? 'Достъп и автентикация' : 'Access and authentication'}
          </p>
          <p className="mt-2 text-xs leading-6 text-base-content/65">
            {isBg
              ? 'Достъпът до приложението се пази чрез защитена автентикация, ролеви проверки и backend проверки за чувствителни действия.'
              : 'Application access is protected through secure authentication, role checks, and backend authorization for sensitive actions.'}
          </p>
        </article>

        <article className="rounded-xl border border-base-300 bg-base-100 p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-base-content">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {isBg ? 'Допълнителни права' : 'Additional privileges'}
          </p>
          <p className="mt-2 text-sm font-semibold text-base-content">
            {user?.hasInstructorPrivileges
              ? isBg
                ? 'Има инструкторски права'
                : 'Instructor privileges enabled'
              : isBg
                ? 'Няма инструкторски права'
                : 'No instructor privileges'}
          </p>
          <p className="mt-1 text-xs text-base-content/60">
            {isBg
              ? 'Това влияе върху достъпа до инструкторските екрани и действия.'
              : 'This affects access to instructor-only screens and actions.'}
          </p>
        </article>
      </div>
    </section>
  )
}
