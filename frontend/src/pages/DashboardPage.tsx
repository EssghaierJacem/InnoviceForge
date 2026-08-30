import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Download, Eye, Gauge } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfidenceBadge } from '@/components/results/ConfidenceBadge'
import { ResultsView } from '@/components/results/ResultsView'
import { ProcessingState } from '@/components/upload/ProcessingState'
import { QuotaExceededModal } from '@/components/upload/QuotaExceededModal'
import { StatusMessage } from '@/components/upload/StatusMessage'
import { UploadZone } from '@/components/upload/UploadZone'
import { apiClient, ApiError } from '@/lib/api-client'
import { downloadResultAsCsv } from '@/lib/csv-export'
import { downloadAuthenticatedFile } from '@/lib/download-file'
import { cn } from '@/lib/utils'
import { AUTHENTICATED_UPLOAD_CONFIG, useUploadPolling } from '@/hooks/useUploadPolling'
import { EXTRACTION_STATUS, type ExtractedInvoice, type Page, type QuotaStatus } from '@/types/api'

const PAGE_SIZE = 10

export function DashboardPage() {
  const navigate = useNavigate()
  const { state, upload, reset } = useUploadPolling<ExtractedInvoice>(AUTHENTICATED_UPLOAD_CONFIG)
  const [quota, setQuota] = useState<QuotaStatus | null>(null)
  const [quotaError, setQuotaError] = useState<string | null>(null)
  const [invoicePage, setInvoicePage] = useState<Page<ExtractedInvoice> | null>(null)
  const [page, setPage] = useState(0)

  const refreshQuota = useCallback(() => {
    apiClient
      .get<QuotaStatus>('/api/v1/quota/status')
      .then((result) => {
        setQuota(result)
        setQuotaError(null)
      })
      .catch((error: unknown) => {
        // Don't swallow this — a silently-null quota looks identical to
        // "haven't fetched yet" and made a real backend bug invisible.
        console.error('Failed to load quota status', error)
        setQuota(null)
        setQuotaError(
          error instanceof ApiError
            ? `Couldn't load your quota (${error.status}: ${error.message})`
            : "Couldn't load your quota — check your connection.",
        )
      })
  }, [])

  // Server-paginated — the table used to fetch every invoice and slice it
  // client-side, which was fine at a handful of rows but would mean
  // fetching a tenant's entire history on every dashboard load as it grows.
  const refreshInvoices = useCallback((pageToLoad: number) => {
    apiClient
      .get<Page<ExtractedInvoice>>(`/api/v1/reports/invoices?page=${pageToLoad}&size=${PAGE_SIZE}`)
      .then(setInvoicePage)
      .catch(() => setInvoicePage({ content: [], page: 0, size: PAGE_SIZE, totalElements: 0, totalPages: 1 }))
  }, [])

  useEffect(() => {
    refreshQuota()
  }, [refreshQuota])

  useEffect(() => {
    refreshInvoices(page)
  }, [page, refreshInvoices])

  useEffect(() => {
    if (state.status === 'success') {
      refreshQuota()
      // A fresh upload always sorts to the top (newest first) — jump back
      // to page 0 so it's actually visible instead of landing on whatever
      // page the user happened to be on.
      setPage(0)
      refreshInvoices(0)
    }
  }, [state.status, refreshQuota, refreshInvoices])

  const showUploadZone = state.status === 'idle' || state.status === 'quota-exceeded'

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-heading text-3xl font-bold tracking-tight text-text-primary">Scan an invoice</h1>
      <p className="mt-1.5 text-sm text-text-secondary">
        Drop in a new file below — it processes automatically and lands in your history further down.
      </p>

      <QuotaStat quota={quota} error={quotaError} />

      <div className="mt-8">
        {showUploadZone && <UploadZone onFileSelected={upload} />}

        {(state.status === 'uploading' || state.status === 'polling') && (
          <ProcessingState phase={state.status === 'uploading' ? 'uploading' : 'polling'} />
        )}

        {state.status === 'timeout' && (
          <StatusMessage
            tone="timeout"
            message="This is taking longer than usual. Your invoice is still in the queue — check back in a minute, or start over with a new file."
            onRetry={reset}
          />
        )}

        {state.status === 'error' && <StatusMessage tone="error" message={state.message} onRetry={reset} />}

        {state.status === 'success' && <ResultsView result={state.result} onProcessAnother={reset} />}

        <QuotaExceededModal open={state.status === 'quota-exceeded'} onDismiss={reset} variant="authenticated" />
      </div>

      <div className="mt-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-semibold text-text-primary">Invoice history</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadAuthenticatedFile('/api/v1/reports/invoices/export/csv', 'invoices.csv')}
            >
              Export all as CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadAuthenticatedFile('/api/v1/reports/invoices/export/xlsx', 'invoices.xlsx')}
            >
              Export all as Excel
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
          <InvoiceHistoryTable
            invoicePage={invoicePage}
            onView={(id) => navigate(`/dashboard/invoices/${id}`)}
            onPrevPage={() => setPage((p) => Math.max(0, p - 1))}
            onNextPage={() => setPage((p) => p + 1)}
          />
        </div>
      </div>
    </div>
  )
}

function QuotaStat({ quota, error }: { quota: QuotaStatus | null; error: string | null }) {
  if (!quota) {
    if (error) {
      return (
        <div className="mt-6 rounded-xl border border-danger/30 bg-danger/5 px-5 py-4 text-sm text-danger">
          {error}
        </div>
      )
    }
    return null
  }

  const isUnlimited = quota.remaining < 0
  const usedPercent = isUnlimited ? 0 : Math.min(100, (quota.used / Math.max(1, quota.dailyLimit)) * 100)

  return (
    <div className="mt-6 flex items-center justify-between gap-6 rounded-xl border border-border bg-surface px-5 py-4">
      <div className="flex items-center gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card-accent-2 text-card-accent-2-foreground">
          <Gauge size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="font-heading text-lg font-semibold text-text-primary">
            {isUnlimited ? 'Unlimited (Pro)' : `${quota.remaining} of ${quota.dailyLimit} scans remaining today`}
          </p>
          <p className="text-sm text-text-secondary">
            {isUnlimited ? 'No daily limit on the Pro plan.' : `${quota.used} used today — resets at midnight.`}
          </p>
        </div>
      </div>

      {!isUnlimited && (
        <div className="hidden w-28 shrink-0 sm:block">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-card-accent-2 transition-all duration-500"
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <p className="mt-1.5 text-right text-xs text-text-secondary">
            {quota.used}/{quota.dailyLimit}
          </p>
        </div>
      )}
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  [EXTRACTION_STATUS.EXTRACTED]: 'bg-success/10 text-success',
  [EXTRACTION_STATUS.NEEDS_REVIEW]: 'bg-warning/10 text-warning',
  [EXTRACTION_STATUS.FAILED]: 'bg-danger/10 text-danger',
}

const STATUS_LABELS: Record<string, string> = {
  [EXTRACTION_STATUS.EXTRACTED]: 'Extracted',
  [EXTRACTION_STATUS.NEEDS_REVIEW]: 'Needs review',
  [EXTRACTION_STATUS.FAILED]: 'Failed',
}

interface InvoiceHistoryTableProps {
  invoicePage: Page<ExtractedInvoice> | null
  onView: (id: string) => void
  onPrevPage: () => void
  onNextPage: () => void
}

function InvoiceHistoryTable({ invoicePage, onView, onPrevPage, onNextPage }: InvoiceHistoryTableProps) {
  if (invoicePage === null) {
    return <p className="px-6 py-14 text-center text-sm text-text-secondary">Loading your invoices…</p>
  }

  const { content: invoices, page, totalPages, totalElements } = invoicePage

  if (invoices.length === 0 && page === 0) {
    return (
      <div className="flex flex-col items-center gap-1.5 px-6 py-16 text-center">
        <p className="font-heading text-base font-semibold text-text-primary">No invoices yet</p>
        <p className="max-w-xs text-sm text-text-secondary">
          Upload your first invoice above and it'll show up here.
        </p>
      </div>
    )
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-11 px-4 text-xs font-semibold tracking-wide text-text-secondary uppercase">
              Vendor
            </TableHead>
            <TableHead className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
              Invoice #
            </TableHead>
            <TableHead className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
              Date
            </TableHead>
            <TableHead className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
              Total
            </TableHead>
            <TableHead className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
              Status
            </TableHead>
            <TableHead className="text-xs font-semibold tracking-wide text-text-secondary uppercase">
              Confidence
            </TableHead>
            <TableHead className="px-4 text-right text-xs font-semibold tracking-wide text-text-secondary uppercase">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const failed = invoice.status === EXTRACTION_STATUS.FAILED
            return (
              <TableRow key={invoice.id} className="border-border last:border-0 hover:bg-background/60">
                <TableCell className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {(invoice.vendorName ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-text-primary">{invoice.vendorName ?? 'Unknown vendor'}</span>
                  </div>
                </TableCell>
                <TableCell className="py-3.5 text-text-secondary">{invoice.invoiceNumber ?? '—'}</TableCell>
                <TableCell className="py-3.5 text-text-secondary">{invoice.issueDate ?? '—'}</TableCell>
                <TableCell className="py-3.5 font-medium tabular-nums text-text-primary">
                  {invoice.totalAmount !== null
                    ? `${invoice.totalAmount.toFixed(2)} ${invoice.currency ?? ''}`.trim()
                    : '—'}
                </TableCell>
                <TableCell className="py-3.5">
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                      STATUS_STYLES[invoice.status] ?? 'bg-border text-text-secondary',
                    )}
                  >
                    {STATUS_LABELS[invoice.status] ?? invoice.status}
                  </span>
                </TableCell>
                <TableCell className="py-3.5">
                  <ConfidenceBadge confidenceScore={invoice.confidenceScore} />
                </TableCell>
                <TableCell className="px-4 py-3.5 text-right">
                  {failed ? (
                    <span className="text-xs text-text-secondary">Processing failed — nothing to view</span>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onView(invoice.id)}
                        aria-label={`View ${invoice.vendorName ?? 'invoice'}`}
                      >
                        <Eye size={16} aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => downloadResultAsCsv(invoice)}
                        aria-label={`Download ${invoice.vendorName ?? 'invoice'} as CSV`}
                      >
                        <Download size={16} aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border bg-background/40 px-4 py-3">
          <p className="text-xs text-text-secondary">
            Page {page + 1} of {totalPages} · {totalElements} invoices total
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onPrevPage}
              disabled={page === 0}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onNextPage}
              disabled={page >= totalPages - 1}
              aria-label="Next page"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
