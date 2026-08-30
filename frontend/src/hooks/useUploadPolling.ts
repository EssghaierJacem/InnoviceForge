import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient, ApiError } from '@/lib/api-client'
import type { InvoiceUploadResponse } from '@/types/api'

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 60000
const SAMPLE_UPLOAD_DELAY_MS = 700
const SAMPLE_POLL_DELAY_MS = 900

export type UploadState<TResult> =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'polling'; invoiceId: string }
  | { status: 'success'; invoiceId: string; result: TResult }
  | { status: 'timeout'; invoiceId: string }
  | { status: 'error'; message: string }
  | { status: 'quota-exceeded' }

export interface UploadPollingConfig {
  uploadPath: string
  pollPath: (invoiceId: string) => string
}

/** The anonymous public flow — HomePage's default. */
export const PUBLIC_UPLOAD_CONFIG: UploadPollingConfig = {
  uploadPath: '/api/v1/public/invoices',
  pollPath: (invoiceId) => `/api/v1/public/reports/invoices/${invoiceId}`,
}

/**
 * The authenticated flow — the dashboard's real upload. Polls by-invoice,
 * not the plain /reports/invoices/{id} (that one is keyed by
 * analytics-service's own ExtractedInvoice id, which doesn't exist yet
 * right after upload — see ExtractedInvoiceController.getByInvoiceId).
 */
export const AUTHENTICATED_UPLOAD_CONFIG: UploadPollingConfig = {
  uploadPath: '/api/v1/invoices',
  pollPath: (invoiceId) => `/api/v1/reports/invoices/by-invoice/${invoiceId}`,
}

export function useUploadPolling<TResult>(config: UploadPollingConfig = PUBLIC_UPLOAD_CONFIG) {
  const [state, setState] = useState<UploadState<TResult>>({ status: 'idle' })
  const pollHandleRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sampleTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const pollDeadlineRef = useRef<number>(0)

  const stopPolling = useCallback(() => {
    if (pollHandleRef.current !== null) {
      clearInterval(pollHandleRef.current)
      pollHandleRef.current = null
    }
    for (const timeout of sampleTimeoutsRef.current) {
      clearTimeout(timeout)
    }
    sampleTimeoutsRef.current = []
  }, [])

  useEffect(() => stopPolling, [stopPolling])

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

  const beginPolling = useCallback(
    (invoiceId: string) => {
      pollDeadlineRef.current = Date.now() + POLL_TIMEOUT_MS
      setState({ status: 'polling', invoiceId })

      pollHandleRef.current = setInterval(async () => {
        try {
          const result = await apiClient.get<TResult>(config.pollPath(invoiceId))
          stopPolling()
          setState({ status: 'success', invoiceId, result })
        } catch (error) {
          handlePollFailure(error, invoiceId)
        }
      }, POLL_INTERVAL_MS)
    },
    [stopPolling, config, handlePollFailure],
  )

  const upload = useCallback(
    async (file: File) => {
      stopPolling()
      setState({ status: 'uploading' })

      try {
        const formData = new FormData()
        formData.append('file', file)
        const response = await apiClient.postForm<InvoiceUploadResponse>(config.uploadPath, formData)
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
    [beginPolling, stopPolling, config],
  )

  /**
   * Zero-network path for sample invoices (see lib/sample-data.ts): plays
   * out the same uploading → polling → success beats as a real upload,
   * purely on timers, so a sample never touches quota — anonymous or
   * authenticated.
   */
  const loadSample = useCallback(
    (result: TResult) => {
      stopPolling()
      setState({ status: 'uploading' })

      const sampleId = 'sample'
      const toPolling = setTimeout(() => {
        setState({ status: 'polling', invoiceId: sampleId })
        const toSuccess = setTimeout(() => {
          setState({ status: 'success', invoiceId: sampleId, result })
        }, SAMPLE_POLL_DELAY_MS)
        sampleTimeoutsRef.current.push(toSuccess)
      }, SAMPLE_UPLOAD_DELAY_MS)
      sampleTimeoutsRef.current.push(toPolling)
    },
    [stopPolling],
  )

  const reset = useCallback(() => {
    stopPolling()
    setState({ status: 'idle' })
  }, [stopPolling])

  return { state, upload, loadSample, reset }
}
