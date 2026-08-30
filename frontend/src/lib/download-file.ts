import { apiClient } from '@/lib/api-client'

/**
 * Fetches an authenticated endpoint as a Blob (auth header attached the
 * same way as every other apiClient call) and triggers a save via an
 * object URL — the browser download dialog itself, not a data: URI,
 * so it works for arbitrarily large exports without inlining the bytes
 * into the DOM.
 */
export async function downloadAuthenticatedFile(path: string, filename: string): Promise<void> {
  const blob = await apiClient.getBlob(path)
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}
