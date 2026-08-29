export type LineItemRow = Record<string, unknown>

/**
 * lineItems comes back as a raw JSON string (see types/api.ts). The
 * shape isn't guaranteed — it's whatever the LLM extraction produced —
 * so this parses defensively and never throws.
 */
export function parseLineItems(raw: string | null): LineItemRow[] | null {
  if (!raw) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as LineItemRow[]) : null
  } catch {
    return null
  }
}

/** Column headers, derived from whatever keys actually appear across the rows. */
export function lineItemColumns(rows: LineItemRow[]): string[] {
  const columns = new Set<string>()
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      columns.add(key)
    }
  }
  return Array.from(columns)
}

export function formatLineItemValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '—'
  }
  return String(value)
}
