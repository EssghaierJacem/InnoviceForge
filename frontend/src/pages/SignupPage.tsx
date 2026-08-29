import { Link } from 'react-router-dom'

export function SignupPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Coming soon</h1>
      <p className="mt-4 text-text-secondary">
        Sign up will be available shortly. We're finishing account creation so you can get 5 uploads
        a day, every day, with no login limits.
      </p>
      <Link to="/" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">
        ← Back home
      </Link>
    </div>
  )
}
