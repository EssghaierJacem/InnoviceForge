import { Check, X } from 'lucide-react'
import { RevealSection } from '@/components/marketing/RevealSection'
import { SectionBand } from '@/components/marketing/SectionBand'

const ROWS = [
  {
    pain: 'Someone retypes every vendor name, date, and line item by hand, and odd-looking invoices get entered the same way as clean ones — no signal either way.',
    answer: 'Upload the file — vendor, dates, amounts, and line items come back structured, each with a confidence score so you know how much to trust it at a glance.',
  },
  {
    pain: 'A file gets stuck or fails partway through, and nobody notices until someone goes looking for it.',
    answer: 'A retry pipeline re-attempts failed extractions automatically, and anything still uncertain is flagged for review instead of being silently accepted.',
  },
  {
    pain: 'Multiple teams or clients share one messy spreadsheet of invoices.',
    answer: "Data is scoped per tenant, so each account's invoices stay separate by design.",
  },
] as const

export function ComparisonSection() {
  return (
    <SectionBand tone="default">
      <RevealSection>
        <p className="text-center text-xs font-semibold tracking-widest text-primary uppercase">The difference</p>
        <h2 className="mt-3 text-center font-heading text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Manual entry vs. InvoiceForge
        </h2>
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7">
            <p className="text-xs font-semibold tracking-wide text-text-secondary uppercase">Manual entry</p>
            <ul className="mt-5 flex flex-col gap-4">
              {ROWS.map((row) => (
                <li key={row.pain} className="flex items-start gap-2.5">
                  <X size={16} className="mt-0.5 shrink-0 text-text-secondary" aria-hidden="true" />
                  <p className="text-sm text-text-secondary">{row.pain}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-primary p-6 text-on-dark shadow-xl shadow-primary/20 sm:p-7">
            <p className="text-xs font-semibold tracking-wide text-on-dark/70 uppercase">
              InvoiceForge
            </p>
            <ul className="mt-5 flex flex-col gap-4">
              {ROWS.map((row) => (
                <li key={row.answer} className="flex items-start gap-2.5">
                  <Check size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <p className="text-sm">{row.answer}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </RevealSection>
    </SectionBand>
  )
}
