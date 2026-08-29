import type { PublicExtractionResultDTO } from '@/types/api'

interface InvoiceDetailsProps {
  result: PublicExtractionResultDTO
}

function formatAmount(amount: number | null, currency: string | null): string {
  if (amount === null) {
    return '—'
  }
  return currency ? `${amount.toFixed(2)} ${currency}` : amount.toFixed(2)
}

export function InvoiceDetails({ result }: InvoiceDetailsProps) {
  const fields: Array<{ label: string; value: string }> = [
    { label: 'Vendor', value: result.vendorName ?? '—' },
    { label: 'Invoice number', value: result.invoiceNumber ?? '—' },
    { label: 'Issue date', value: result.issueDate ?? '—' },
    { label: 'Category', value: result.category ?? '—' },
    { label: 'Total', value: formatAmount(result.totalAmount, result.currency) },
    { label: 'Tax', value: formatAmount(result.taxAmount, result.currency) },
  ]

  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label}>
          <dt className="text-sm text-text-secondary">{field.label}</dt>
          <dd className="mt-0.5 text-base font-medium text-text-primary">{field.value}</dd>
        </div>
      ))}
    </div>
  )
}
