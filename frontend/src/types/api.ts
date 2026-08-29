/**
 * These interfaces mirror the actual Java model fields (Lombok @Getter,
 * default Jackson camelCase serialization — no naming strategy override
 * in either service), read directly from:
 *   backend/ingestion-service/.../model/Invoice.java
 *   backend/analytics-service/.../model/ExtractedInvoice.java
 */

/** GET /api/v1/invoices/{id} (ingestion-service) */
export interface Invoice {
  id: string
  tenantId: string
  userId: string
  fileKey: string
  fileHash: string
  originalFilename: string
  mimeType: string
  sizeBytes: number
  status: string
  createdAt: string
  updatedAt: string
}

/**
 * POST /api/v1/invoices and POST /api/v1/public/invoices return only a
 * subset of Invoice (see InvoiceController#acceptedResponse), not the
 * full entity.
 */
export interface InvoiceUploadResponse {
  id: string
  status: string
}

/**
 * GET /api/v1/reports/invoices and /{id} (analytics-service).
 * lineItems is the raw JSON string stored in the jsonb column — the
 * backend does not parse it before returning it.
 */
export interface ExtractedInvoice {
  id: string
  invoiceId: string
  tenantId: string
  vendorName: string | null
  invoiceNumber: string | null
  issueDate: string | null
  currency: string | null
  totalAmount: number | null
  taxAmount: number | null
  category: string | null
  lineItems: string | null
  confidenceScore: number | null
  status: string
  reviewedByUser: boolean
  createdAt: string
}
