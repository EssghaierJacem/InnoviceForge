import { userManager } from '@/lib/auth-config'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Reads the current user straight from the shared UserManager (see
 * lib/auth-config.ts) rather than through useAuth() — this module runs
 * outside any component, so there's no React context to read from here.
 * react-oidc-context's AuthProvider is handed that same UserManager
 * instance, so both sides always agree on the current session; there's
 * no second source of truth to drift out of sync.
 *
 * Anonymous requests are unaffected: getUser() resolves to null when
 * nobody's logged in, and the header is simply omitted.
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const user = await userManager.getUser()
  if (!user || user.expired) {
    return {}
  }
  return { Authorization: `Bearer ${user.access_token}` }
}

async function extractErrorMessage(response: Response, path: string): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
      return body.error
    }
  } catch {
    // body wasn't JSON (or was empty) — fall through to the generic message
  }
  return `Request to ${path} failed with status ${response.status}`
}

async function request<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(await getAuthHeaders()),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status, await extractErrorMessage(response, path))
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await response.json()) as TResponse
}

async function requestBlob(path: string): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: await getAuthHeaders(),
  })

  if (!response.ok) {
    throw new ApiError(response.status, await extractErrorMessage(response, path))
  }

  return response.blob()
}

export const apiClient = {
  get: <TResponse>(path: string) => request<TResponse>(path, { method: 'GET' }),

  getBlob: (path: string) => requestBlob(path),

  postForm: <TResponse>(path: string, formData: FormData) =>
    request<TResponse>(path, { method: 'POST', body: formData }),

  postJson: <TResponse, TBody = unknown>(path: string, body: TBody) =>
    request<TResponse>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
}
