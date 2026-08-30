import { UserManager, WebStorageStateStore } from 'oidc-client-ts'

const authority = import.meta.env.VITE_KEYCLOAK_ISSUER as string

/**
 * A single shared UserManager instance, rather than letting AuthProvider
 * construct its own internally. This is what makes the current token
 * reachable from lib/api-client.ts, which runs outside any React
 * component and can't call useAuth() — see the comment there for how
 * it's used.
 */
export const userManager = new UserManager({
  authority,
  client_id: 'gateway',
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
})

/**
 * A separate UserManager for the sign-up flow. `prompt=create` (the OIDC
 * "Initiating User Registration" param, RFC-ish extension) does not route
 * to Keycloak's registration form in this realm — verified by hitting the
 * authorize endpoint directly, which returns the plain login page
 * (kc-form-login, only a username field) regardless of prompt=create.
 * Keycloak's actual registration form lives at a dedicated endpoint,
 * `/protocol/openid-connect/registrations`, which takes the same OAuth
 * params and completes the same authorization-code flow back to
 * redirect_uri. `metadataSeed` overrides just authorization_endpoint while
 * everything else (token_endpoint, jwks_uri, ...) still comes from the
 * real discovery document, and since neither UserManager sets a custom
 * stateStore, both share the same default sessionStorage-backed store —
 * so the existing CallbackPage handles this flow's redirect with no
 * changes needed.
 */
export const registrationUserManager = new UserManager({
  authority,
  client_id: 'gateway',
  redirect_uri: `${window.location.origin}/callback`,
  post_logout_redirect_uri: window.location.origin,
  response_type: 'code',
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  metadataSeed: { authorization_endpoint: `${authority}/protocol/openid-connect/registrations` },
})

/** Strips the code/state query params Keycloak appends after redirecting back. */
export function onSigninCallback() {
  window.history.replaceState({}, document.title, window.location.pathname)
}
