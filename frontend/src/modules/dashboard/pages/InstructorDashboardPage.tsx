import DashboardShell from '../components/DashboardShell.js'

export default function InstructorDashboardPage() {
  return (
    <DashboardShell
      title="Instructor Dashboard"
      subtitle="Teaching workflow and student progress tools."
      items={[
        'View today lessons and route plans',
        'Update student progress after each session',
        'Submit attendance and practical exam readiness',
        'Coordinate schedule adjustments with school admin',
      ]}
    />
  )
}

