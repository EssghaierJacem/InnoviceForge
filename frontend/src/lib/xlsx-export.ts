import * as XLSX from 'xlsx'

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

function toRow(result: PublicExtractionResultDTO): Record<(typeof HEADERS)[number], unknown> {
  return {
    vendor_name: result.vendorName,
    contact_name: result.contactName,
    invoice_number: result.invoiceNumber,
    po_number: result.poNumber,
    issue_date: result.issueDate,
    due_date: result.dueDate,
    currency: result.currency,
    total_amount: result.totalAmount,
    subtotal: result.subtotal,
    tax_amount: result.taxAmount,
    payment_terms: result.paymentTerms,
    payment_method: result.paymentMethod,
    category: result.category,
    confidence_score: result.confidenceScore,
    status: result.status,
  }
}

/**
 * Single-row client-side XLSX export for the anonymous flow, mirroring
 * downloadResultAsCsv — no authenticated tenant to call the backend's
 * bulk export endpoints for.
 */
export function downloadResultAsXlsx(result: PublicExtractionResultDTO): void {
  const worksheet = XLSX.utils.json_to_sheet([toRow(result)], { header: [...HEADERS] })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice')
  XLSX.writeFile(workbook, 'invoice.xlsx')
}
