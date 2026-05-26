import { useOutletContext } from 'react-router-dom'

export type DashboardToastKind = 'success' | 'error'

export interface DashboardShellOutletContext {
  pushToast: (kind: DashboardToastKind, message: string) => void
}

export function useDashboardShell() {
  const context = useOutletContext<DashboardShellOutletContext | undefined>()
  return context ?? {
    pushToast: () => {
      // Fallback no-op to prevent route-level crashes when outlet context is unavailable.
    },
  }
}
