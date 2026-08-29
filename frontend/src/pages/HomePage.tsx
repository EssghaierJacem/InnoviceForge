import { ProcessingState } from '@/components/upload/ProcessingState'
import { QuotaExceededModal } from '@/components/upload/QuotaExceededModal'
import { StatusMessage } from '@/components/upload/StatusMessage'
import { UploadZone } from '@/components/upload/UploadZone'
import { ResultsView } from '@/components/results/ResultsView'
import { useUploadPolling } from '@/hooks/useUploadPolling'

export function HomePage() {
  const { state, upload, reset } = useUploadPolling()
  const showUploadZone = state.status === 'idle' || state.status === 'quota-exceeded'

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      {showUploadZone && (
        <>
          <div className="mb-10 text-center">
            <h1 className="font-heading text-3xl font-semibold text-text-primary">
              Upload an invoice, get structured data back in seconds
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">
              Drop in a PDF or photo of an invoice and InvoiceForge reads the vendor, amounts, and line
              items for you — no manual entry, no template to fill out.
            </p>
          </div>

          <UploadZone onFileSelected={upload} />

          <p className="mt-4 text-center text-xs text-text-secondary">
            No account needed. Your file is stored so we can process and show you these results — we
            don't currently delete anonymous uploads automatically.
          </p>
        </>
      )}

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

      {state.status === 'error' && (
        <StatusMessage tone="error" message={state.message} onRetry={reset} />
      )}

      {state.status === 'success' && (
        <ResultsView result={state.result} onProcessAnother={reset} />
      )}

      <QuotaExceededModal open={state.status === 'quota-exceeded'} onDismiss={reset} />
    </div>
  )
}
