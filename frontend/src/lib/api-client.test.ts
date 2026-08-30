import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUser = vi.fn()

// api-client.ts reads the current user straight from the shared
// UserManager (see its own file comment) rather than through useAuth(),
// since it runs outside any React component — mocking that one export is
// what makes it testable in isolation without standing up react-oidc-context.
vi.mock('@/lib/auth-config', () => ({
  userManager: { getUser },
}))

const { apiClient, ApiError } = await import('@/lib/api-client')

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  getUser.mockReset()
  getUser.mockResolvedValue(null)
  vi.stubGlobal('fetch', vi.fn())
})

describe('apiClient.get', () => {
  it('omits the Authorization header when nobody is logged in', async () => {
    getUser.mockResolvedValue(null)
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ ok: true }))

    await apiClient.get('/api/v1/quota/status')

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect((init?.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('attaches a Bearer token from the shared session when one exists', async () => {
    getUser.mockResolvedValue({ expired: false, access_token: 'token-123' })
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ ok: true }))

    await apiClient.get('/api/v1/quota/status')

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer token-123')
  })

  it('treats an expired session the same as no session', async () => {
    getUser.mockResolvedValue({ expired: true, access_token: 'stale-token' })
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ ok: true }))

    await apiClient.get('/api/v1/quota/status')

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect((init?.headers as Record<string, string>).Authorization).toBeUndefined()
  })

  it('resolves with the parsed JSON body on success', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ plan: 'FREE', used: 2 }))

    const result = await apiClient.get<{ plan: string; used: number }>('/api/v1/quota/status')

    expect(result).toEqual({ plan: 'FREE', used: 2 })
  })

  it('resolves with undefined on a 204 with no body', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }))

    const result = await apiClient.get('/api/v1/reports/invoices/export/csv')

    expect(result).toBeUndefined()
  })
})

describe('apiClient error handling', () => {
  it('throws an ApiError carrying the response status', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: 'not found' }, 404))

    await expect(apiClient.get('/api/v1/reports/invoices/nope')).rejects.toMatchObject({
      status: 404,
    })
  })

  it('surfaces the backend-provided error message when the body has one', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: 'Daily upload limit reached' }, 429))

    await expect(apiClient.get('/api/v1/invoices')).rejects.toThrow('Daily upload limit reached')
  })

  it('falls back to a generic message when the error body is not JSON', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('<html>502</html>', { status: 502 }))

    await expect(apiClient.get('/api/v1/invoices')).rejects.toThrow(/failed with status 502/)
  })

  it('is an instance of ApiError specifically, not just Error', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ error: 'nope' }, 403))

    try {
      await apiClient.get('/api/v1/quota/status')
      expect.unreachable('expected apiClient.get to throw')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
    }
  })
})

describe('apiClient.postJson', () => {
  it('sends a JSON content-type header and a serialized body', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse({ id: '1' }))

    await apiClient.postJson('/api/v1/something', { name: 'Acme' })

    const [, init] = vi.mocked(fetch).mock.calls[0]
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    expect(init?.body).toBe(JSON.stringify({ name: 'Acme' }))
  })
})
