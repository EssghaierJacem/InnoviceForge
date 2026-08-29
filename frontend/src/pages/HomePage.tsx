import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { BenefitsSection } from '@/components/marketing/BenefitsSection'
import { ComparisonSection } from '@/components/marketing/ComparisonSection'
import { FaqSection } from '@/components/marketing/FaqSection'
import { FloatingBadge } from '@/components/marketing/FloatingBadge'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { PricingSection } from '@/components/marketing/PricingSection'
import { UpgradeBanner } from '@/components/marketing/UpgradeBanner'
import { ProcessingState } from '@/components/upload/ProcessingState'
import { QuotaExceededModal } from '@/components/upload/QuotaExceededModal'
import { SampleInvoices } from '@/components/upload/SampleInvoices'
import { StatusMessage } from '@/components/upload/StatusMessage'
import { UploadZone } from '@/components/upload/UploadZone'
import { ResultsView } from '@/components/results/ResultsView'
import { useUploadPolling } from '@/hooks/useUploadPolling'

export function HomePage() {
  const { state, upload, reset } = useUploadPolling()
  const showUploadZone = state.status === 'idle' || state.status === 'quota-exceeded'

  return (
    <div id="top">
      <div className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl">
          {showUploadZone && (
            <>
              <div className="mb-10 text-center">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wide text-primary uppercase">
                  AI-powered invoice extraction
                </span>
                <h1 className="mt-5 font-heading text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
                  Upload an invoice, get structured data back in seconds
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-lg text-text-secondary">
                  Drop in a PDF or photo of an invoice and InvoiceForge reads the vendor, amounts, and line
                  items for you — no manual entry, no template to fill out.
                </p>
                <p className="mx-auto mt-2 max-w-xl text-sm text-text-secondary">
                  Works with typed invoices, handwritten ones, and scanned or photographed documents alike.
                </p>
              </div>

              <div className="relative">
                <UploadZone onFileSelected={upload} />
                <FloatingBadge
                  icon={CheckCircle2}
                  tone="primary"
                  className="absolute -top-4 -right-4 rotate-2"
                >
                  Confidence scored
                </FloatingBadge>
                <FloatingBadge icon={ShieldCheck} className="absolute -bottom-4 -left-4 -rotate-2">
                  Scoped per tenant
                </FloatingBadge>
              </div>

              <p className="mt-4 text-center text-xs text-text-secondary">
                No account needed. Your file is stored so we can process and show you these results — we
                don't currently delete anonymous uploads automatically.
              </p>

              <SampleInvoices onSampleSelected={upload} />
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

          {state.status === 'error' && <StatusMessage tone="error" message={state.message} onRetry={reset} />}

          {state.status === 'success' && <ResultsView result={state.result} onProcessAnother={reset} />}

          <QuotaExceededModal open={state.status === 'quota-exceeded'} onDismiss={reset} />
        </div>
      </div>

      {showUploadZone && (
        <>
          <UpgradeBanner />
          <ComparisonSection />
          <HowItWorks />
          <BenefitsSection />
          <PricingSection />
          <FaqSection />
        </>
      )}
    </div>
  )
}
