import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatLineItemValue, lineItemColumns, parseLineItems } from '@/lib/line-items'

interface LineItemsTableProps {
  lineItemsJson: string | null
}

function titleCase(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase())
}

export function LineItemsTable({ lineItemsJson }: LineItemsTableProps) {
  const rows = parseLineItems(lineItemsJson)

  if (!rows) {
    return <p className="text-sm text-text-secondary">No line items available for this invoice.</p>
  }

  const columns = lineItemColumns(rows)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column}>{titleCase(column)}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index}>
            {columns.map((column) => (
              <TableCell key={column}>{formatLineItemValue(row[column])}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
