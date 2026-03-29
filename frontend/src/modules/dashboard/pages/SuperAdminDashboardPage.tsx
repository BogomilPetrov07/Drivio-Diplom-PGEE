import DashboardShell from '../components/DashboardShell.js'

export default function SuperAdminDashboardPage() {
  return (
    <DashboardShell
      title="Super Admin Dashboard"
      subtitle="Platform-level command center for Drivio."
      items={[
        'Monitor onboarding conversion across all schools',
        'Review platform-wide security events and audit records',
        'Manage system configuration and role governance',
        'Track billing and active subscriptions',
      ]}
    />
  )
}

