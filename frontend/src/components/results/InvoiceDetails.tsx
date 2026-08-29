import type { PublicExtractionResultDTO } from '@/types/api'

interface InvoiceDetailsProps {
  result: PublicExtractionResultDTO
}

function formatAmount(amount: number | null, currency: string | null): string | null {
  if (amount === null) {
    return null
  }
  return currency ? `${amount.toFixed(2)} ${currency}` : amount.toFixed(2)
}

export function InvoiceDetails({ result }: InvoiceDetailsProps) {
  const fields: Array<{ label: string; value: string | null }> = [
    { label: 'Vendor', value: result.vendorName },
    { label: 'Contact name', value: result.contactName },
    { label: 'Invoice number', value: result.invoiceNumber },
    { label: 'PO number', value: result.poNumber },
    { label: 'Issue date', value: result.issueDate },
    { label: 'Due date', value: result.dueDate },
    { label: 'Payment terms', value: result.paymentTerms },
    { label: 'Payment method', value: result.paymentMethod },
    { label: 'Category', value: result.category },
    { label: 'Subtotal', value: formatAmount(result.subtotal, result.currency) },
    { label: 'Tax', value: formatAmount(result.taxAmount, result.currency) },
    { label: 'Total', value: formatAmount(result.totalAmount, result.currency) },
  ].filter((field) => field.value !== null)

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
