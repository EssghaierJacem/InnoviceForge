import { useEffect, type ReactNode } from 'react'
import { useAuth } from 'react-oidc-context'

interface ProtectedRouteProps {
  children: ReactNode
}

/**
 * Not wired to any route yet (Stage 9 is auth-mechanism only). When the
 * dashboard route lands, wrap it in this: <ProtectedRoute><Dashboard /></ProtectedRoute>.
 * Chose "trigger login" over "redirect home" — bouncing an unauthenticated
 * visitor straight to Keycloak is one fewer click than dumping them on the
 * homepage and making them find the login button themselves.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useAuth()

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      void auth.signinRedirect()
    }
    // auth.signinRedirect is intentionally omitted — it's a new reference
    // every render, and including it would re-fire the redirect in a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isLoading, auth.isAuthenticated])

  if (!auth.isAuthenticated) {
    return null
  }

  return <>{children}</>
}
