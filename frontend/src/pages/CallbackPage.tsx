import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { apiClient } from '@/lib/api-client'

/**
 * Keycloak redirects back here after login; AuthProvider exchanges the
 * code automatically. A freshly self-registered user has no tenant_id
 * attribute yet (it's admin-only-editable in Keycloak — see
 * TenantProvisioningService on the backend), so before landing on the
 * dashboard this checks for one and provisions it if missing.
 */
export function CallbackPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [provisioning, setProvisioning] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    if (auth.isLoading || auth.error || startedRef.current) {
      return
    }
    startedRef.current = true

    async function ensureTenant() {
      const tenantId = auth.user?.profile.tenant_id
      if (typeof tenantId === 'string' && tenantId.length > 0) {
        navigate('/', { replace: true })
        return
      }

      setProvisioning(true)
      try {
        const result = await apiClient.postJson<{ provisioned: boolean }, Record<string, never>>(
          '/api/v1/tenant/provision',
          {},
        )
        if (result.provisioned) {
          // The token just used to provision still has no tenant_id claim —
          // JWTs are immutable once issued — so a silent renewal is the only
          // way to pick up the one that was just assigned.
          await auth.signinSilent()
        }
      } finally {
        navigate('/', { replace: true })
      }
    }

    void ensureTenant()
    // auth.user/auth.signinSilent read inside the effect on purpose: this
    // should run exactly once per callback, guarded by startedRef, not
    // re-run whenever react-oidc-context hands back a new auth object.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.isLoading, auth.error, navigate])

  if (auth.error) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Login failed</h1>
        <p className="mt-4 text-text-secondary">{auth.error.message}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="text-text-secondary">{provisioning ? 'Setting up your account…' : 'Signing you in…'}</p>
    </div>
  )
}
