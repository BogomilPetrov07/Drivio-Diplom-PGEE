import { useOutletContext } from 'react-router-dom'

export type DashboardToastKind = 'success' | 'error'

export interface DashboardShellOutletContext {
  pushToast: (kind: DashboardToastKind, message: string) => void
}

export function useDashboardShell() {
  return useOutletContext<DashboardShellOutletContext>()
}
