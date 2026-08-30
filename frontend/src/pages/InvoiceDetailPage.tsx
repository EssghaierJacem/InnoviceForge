import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfidenceBadge } from '@/components/results/ConfidenceBadge'
import { InvoiceDetails } from '@/components/results/InvoiceDetails'
import { LineItemsTable } from '@/components/results/LineItemsTable'
import { NeedsReviewBanner } from '@/components/results/NeedsReviewBanner'
import { apiClient, ApiError } from '@/lib/api-client'
import { EXTRACTION_STATUS, type ExtractedInvoice } from '@/types/api'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; invoice: ExtractedInvoice }

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    if (!id) {
      return
    }
    setState({ status: 'loading' })
    apiClient
      .get<ExtractedInvoice>(`/api/v1/reports/invoices/${id}`)
      .then((invoice) => setState({ status: 'ready', invoice }))
      .catch((error: unknown) => {
        const message =
          error instanceof ApiError && error.status === 404
            ? "This invoice doesn't exist, or isn't yours."
            : 'Something went wrong loading this invoice.'
        setState({ status: 'error', message })
      })
  }, [id])

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link to="/dashboard" className="text-sm font-medium text-primary hover:underline">
        ← Back to dashboard
      </Link>

      {state.status === 'loading' && <p className="mt-8 text-sm text-text-secondary">Loading invoice…</p>}

      {state.status === 'error' && <p className="mt-8 text-sm text-danger">{state.message}</p>}

      {state.status === 'ready' && (
        <div className="mt-6 flex flex-col gap-6">
          {state.invoice.status === EXTRACTION_STATUS.NEEDS_REVIEW && <NeedsReviewBanner />}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invoice details</CardTitle>
                <ConfidenceBadge confidenceScore={state.invoice.confidenceScore} />
              </div>
            </CardHeader>
            <CardContent>
              <InvoiceDetails result={state.invoice} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line items</CardTitle>
            </CardHeader>
            <CardContent>
              <LineItemsTable lineItemsJson={state.invoice.lineItems} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
