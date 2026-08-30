import type { PublicExtractionResultDTO } from '@/types/api'

/**
 * Pre-computed mock results for the "try a sample invoice" flow (see
 * components/upload/SampleInvoices.tsx). Deliberately never touches the
 * real upload/parsing pipeline — no network call, no quota consumed,
 * anonymous or authenticated. Shapes match PublicExtractionResultDTO
 * exactly, so they render through the same ResultsView/InvoiceDetails/
 * LineItemsTable components a real result would.
 */

export const SAMPLE_PROFESSIONAL_INVOICE: PublicExtractionResultDTO = {
  vendorName: 'Acme Office Supplies',
  contactName: 'Jordan Reyes',
  invoiceNumber: 'INV-10432',
  poNumber: 'PO-88213',
  issueDate: '2026-07-14',
  dueDate: '2026-08-13',
  currency: 'USD',
  totalAmount: 1284.5,
  subtotal: 1180,
  taxAmount: 104.5,
  paymentTerms: 'Net 30',
  paymentMethod: 'Bank transfer',
  category: 'Office supplies',
  lineItems: JSON.stringify([
    { description: 'Standing desks', quantity: 2, unitPrice: 420, amount: 840 },
    { description: 'Ergonomic chairs', quantity: 2, unitPrice: 150, amount: 300 },
    { description: 'Monitor arms', quantity: 4, unitPrice: 10, amount: 40 },
  ]),
  confidenceScore: 0.96,
  status: 'EXTRACTED',
}

export const SAMPLE_HANDWRITTEN_INVOICE: PublicExtractionResultDTO = {
  vendorName: 'QuickFix Plumbing & Heating',
  contactName: null,
  invoiceNumber: null,
  poNumber: null,
  issueDate: '2026-03-09',
  dueDate: null,
  currency: 'USD',
  totalAmount: 277,
  subtotal: null,
  taxAmount: null,
  paymentTerms: null,
  paymentMethod: 'Check',
  category: 'Home repair',
  lineItems: JSON.stringify([
    { description: 'Misc fittings', amount: 38 },
    { description: 'New valve', amount: 64 },
    { description: 'Labor (2.5 hrs)', amount: 175 },
  ]),
  confidenceScore: 0.62,
  status: 'NEEDS_REVIEW',
}
