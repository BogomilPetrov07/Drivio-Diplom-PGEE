import DashboardShell from '../components/DashboardShell.js'

export default function StudentDashboardPage() {
  return (
    <DashboardShell
      title="Student Dashboard"
      subtitle="Your lessons, progress, and driving journey."
      items={[
        'See upcoming lessons and instructor assignments',
        'Track completed modules and remaining milestones',
        'Review instructor feedback and next practice goals',
        'Manage reminders and notifications',
      ]}
    />
  )
}

