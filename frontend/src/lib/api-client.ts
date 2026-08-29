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
 * Returns the auth headers to attach to every request. Real auth (JWT
 * from Keycloak) lands in a later stage — swapping this for a Bearer
 * token lookup is a one-line change here, not a rewrite of every call
 * site.
 */
function getAuthHeaders(): HeadersInit {
  return {}
}

async function request<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(response.status, `Request to ${path} failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await response.json()) as TResponse
}

export const apiClient = {
  get: <TResponse>(path: string) => request<TResponse>(path, { method: 'GET' }),

  postForm: <TResponse>(path: string, formData: FormData) =>
    request<TResponse>(path, { method: 'POST', body: formData }),

  postJson: <TResponse, TBody = unknown>(path: string, body: TBody) =>
    request<TResponse>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
}
