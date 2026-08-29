import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient, ApiError } from '@/lib/api-client'
import type { InvoiceUploadResponse, PublicExtractionResultDTO } from '@/types/api'

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 60000

export type UploadState =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'polling'; invoiceId: string }
  | { status: 'success'; invoiceId: string; result: PublicExtractionResultDTO }
  | { status: 'timeout'; invoiceId: string }
  | { status: 'error'; message: string }
  | { status: 'quota-exceeded' }

export function useUploadPolling() {
  const [state, setState] = useState<UploadState>({ status: 'idle' })
  const pollHandleRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollDeadlineRef = useRef<number>(0)

  const stopPolling = useCallback(() => {
    if (pollHandleRef.current !== null) {
      clearInterval(pollHandleRef.current)
      pollHandleRef.current = null
    }
  }, [])

  useEffect(() => stopPolling, [stopPolling])

  const beginPolling = useCallback(
    (invoiceId: string) => {
      pollDeadlineRef.current = Date.now() + POLL_TIMEOUT_MS
      setState({ status: 'polling', invoiceId })

      pollHandleRef.current = setInterval(async () => {
        try {
          const result = await apiClient.get<PublicExtractionResultDTO>(
            `/api/v1/public/reports/invoices/${invoiceId}`,
          )
          stopPolling()
          setState({ status: 'success', invoiceId, result })
        } catch (error) {
          handlePollFailure(error, invoiceId)
        }
      }, POLL_INTERVAL_MS)
    },
    [stopPolling],
  )

  const handlePollFailure = useCallback(
    (error: unknown, invoiceId: string) => {
      const notYetProcessed = error instanceof ApiError && error.status === 404

      if (notYetProcessed) {
        if (Date.now() >= pollDeadlineRef.current) {
          stopPolling()
          setState({ status: 'timeout', invoiceId })
        }
        return
      }

      stopPolling()
      setState({ status: 'error', message: 'Something went wrong while checking on your invoice.' })
    },
    [stopPolling],
  )

  const upload = useCallback(
    async (file: File) => {
      stopPolling()
      setState({ status: 'uploading' })

      try {
        const formData = new FormData()
        formData.append('file', file)
        const response = await apiClient.postForm<InvoiceUploadResponse>('/api/v1/public/invoices', formData)
        beginPolling(response.id)
      } catch (error) {
        if (error instanceof ApiError && error.status === 429) {
          setState({ status: 'quota-exceeded' })
          return
        }
        const message = error instanceof ApiError ? error.message : 'Upload failed. Please try again.'
        setState({ status: 'error', message })
      }
    },
    [beginPolling, stopPolling],
  )

  const reset = useCallback(() => {
    stopPolling()
    setState({ status: 'idle' })
  }, [stopPolling])

  return { state, upload, reset }
}
