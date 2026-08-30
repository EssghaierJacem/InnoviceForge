import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { registrationUserManager } from '@/lib/auth-config'

export function SignupPage() {
  function handleCreateAccount() {
    // prompt=create didn't route to Keycloak's registration form in this
    // realm (verified directly against the authorize endpoint — it just
    // returns the plain login page). registrationUserManager points at
    // Keycloak's actual registration endpoint instead; see auth-config.ts.
    void registrationUserManager.signinRedirect()
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="font-heading text-2xl font-semibold text-text-primary">Create your account</h1>
      <p className="mt-4 text-text-secondary">
        Get 5 uploads a day, every day — no time limit like the anonymous flow, plus a permanent record
        of everything you process.
      </p>
      <Button className="mt-8 rounded-full px-6" onClick={handleCreateAccount}>
        Create your account
      </Button>
      <Link to="/" className="mt-6 block text-sm font-medium text-primary hover:underline">
        ← Back home
      </Link>
    </div>
  )
}
