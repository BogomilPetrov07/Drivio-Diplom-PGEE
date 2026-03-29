import DashboardShell from '../components/DashboardShell.js'

export default function SchoolAdminDashboardPage() {
  return (
    <DashboardShell
      title="School Admin Dashboard"
      subtitle="Operational dashboard for your driving school."
      items={[
        'Approve instructor accounts and assign classes',
        'Review lesson schedules and student allocation',
        'Manage school profile, locations, and fleet',
        'Track enrollment and completion metrics',
      ]}
    />
  )
}

