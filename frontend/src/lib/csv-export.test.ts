import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadResultAsCsv } from '@/lib/csv-export'
import type { PublicExtractionResultDTO } from '@/types/api'

const BASE_RESULT: PublicExtractionResultDTO = {
  vendorName: 'Acme Co',
  contactName: null,
  invoiceNumber: 'INV-1',
  poNumber: null,
  issueDate: '2026-01-15',
  dueDate: null,
  currency: 'USD',
  totalAmount: 150,
  subtotal: null,
  taxAmount: null,
  paymentTerms: null,
  paymentMethod: null,
  category: null,
  lineItems: null,
  confidenceScore: 0.95,
  status: 'EXTRACTED',
}

// jsdom doesn't implement createObjectURL/revokeObjectURL — this is what
// the module actually calls, not something it can work around, so it has
// to be stubbed for any of this to run under a DOM test environment at all.
let capturedBlob: Blob | null = null

beforeEach(() => {
  capturedBlob = null
  // csv-export.ts only ever calls these two static methods on URL — no
  // `new URL(...)` construction — so a plain object stub is enough.
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn((blob: Blob) => {
      capturedBlob = blob
      return 'blob:mock-url'
    }),
    revokeObjectURL: vi.fn(),
  })
  // jsdom treats a real anchor click as an attempted navigation and logs
  // "Not implemented" for it — irrelevant here, since the thing under test
  // is the CSV content, not that the browser's download UI actually opens.
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function exportedCsvText(result: PublicExtractionResultDTO): Promise<string> {
  downloadResultAsCsv(result)
  if (!capturedBlob) {
    throw new Error('downloadResultAsCsv never called URL.createObjectURL')
  }
  return capturedBlob.text()
}

describe('downloadResultAsCsv', () => {
  it('writes the header row followed by one data row', async () => {
    const csv = await exportedCsvText(BASE_RESULT)
    const [header, dataRow] = csv.trim().split('\n')

    expect(header).toBe(
      'vendor_name,contact_name,invoice_number,po_number,issue_date,due_date,currency,total_amount,' +
        'subtotal,tax_amount,payment_terms,payment_method,category,confidence_score,status',
    )
    expect(dataRow).toBe('Acme Co,,INV-1,,2026-01-15,,USD,150,,,,,,0.95,EXTRACTED')
  })

  it('renders null and undefined fields as empty, not the literal word "null"', async () => {
    const csv = await exportedCsvText(BASE_RESULT)

    expect(csv).not.toContain('null')
    expect(csv).not.toContain('undefined')
  })

  it('quotes a field that contains a comma', async () => {
    const csv = await exportedCsvText({ ...BASE_RESULT, vendorName: 'Acme, Inc' })

    expect(csv).toContain('"Acme, Inc"')
  })

  it('escapes embedded quotes by doubling them, per RFC 4180', async () => {
    const csv = await exportedCsvText({ ...BASE_RESULT, vendorName: 'The "Best" Vendor' })

    expect(csv).toContain('"The ""Best"" Vendor"')
  })

  it('quotes a field that contains a newline', async () => {
    const csv = await exportedCsvText({ ...BASE_RESULT, contactName: 'Jane\nDoe' })

    expect(csv).toContain('"Jane\nDoe"')
  })

  it('leaves a plain field unquoted', async () => {
    const csv = await exportedCsvText(BASE_RESULT)

    expect(csv).toContain('Acme Co,')
    expect(csv).not.toContain('"Acme Co"')
  })
})
