import type { PublicExtractionResultDTO } from '@/types/api'

const HEADERS = [
  'vendor_name',
  'contact_name',
  'invoice_number',
  'po_number',
  'issue_date',
  'due_date',
  'currency',
  'total_amount',
  'subtotal',
  'tax_amount',
  'payment_terms',
  'payment_method',
  'category',
  'confidence_score',
  'status',
] as const

function escapeCsvField(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value)
  const needsQuoting = /[",\n]/.test(text)
  const escaped = text.replace(/"/g, '""')
  return needsQuoting ? `"${escaped}"` : escaped
}

function toCsvRow(result: PublicExtractionResultDTO): string {
  return [
    result.vendorName,
    result.contactName,
    result.invoiceNumber,
    result.poNumber,
    result.issueDate,
    result.dueDate,
    result.currency,
    result.totalAmount,
    result.subtotal,
    result.taxAmount,
    result.paymentTerms,
    result.paymentMethod,
    result.category,
    result.confidenceScore,
    result.status,
  ]
    .map(escapeCsvField)
    .join(',')
}

/**
 * Single-row client-side CSV export for the anonymous flow, which has
 * no authenticated tenant to call the backend's bulk export endpoints
 * for. See Stage 2 summary for why this doesn't hit the server.
 */
export function downloadResultAsCsv(result: PublicExtractionResultDTO): void {
  const csv = `${HEADERS.join(',')}\n${toCsvRow(result)}\n`
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'invoice.csv'
  link.click()

  URL.revokeObjectURL(url)
}
