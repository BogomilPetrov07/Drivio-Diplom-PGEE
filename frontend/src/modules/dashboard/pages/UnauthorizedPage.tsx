import { Link } from 'react-router-dom'

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <section className="max-w-lg rounded-2xl border border-base-300 bg-base-100 p-8 shadow-xl text-center">
        <h1 className="text-3xl font-bold text-base-content">Unauthorized</h1>
        <p className="mt-3 text-base-content/70">
          Your account does not have permission to open this dashboard.
        </p>
        <Link className="btn btn-primary mt-6" to="/login">
          Back to login
        </Link>
      </section>
    </main>
  )
}

