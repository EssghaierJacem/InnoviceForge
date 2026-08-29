import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfidenceBadge } from '@/components/results/ConfidenceBadge'
import { InvoiceDetails } from '@/components/results/InvoiceDetails'
import { LineItemsTable } from '@/components/results/LineItemsTable'
import { NeedsReviewBanner } from '@/components/results/NeedsReviewBanner'
import { downloadResultAsCsv } from '@/lib/csv-export'
import { downloadResultAsXlsx } from '@/lib/xlsx-export'
import { EXTRACTION_STATUS, type PublicExtractionResultDTO } from '@/types/api'

interface ResultsViewProps {
  result: PublicExtractionResultDTO
  onProcessAnother: () => void
}

export function ResultsView({ result, onProcessAnother }: ResultsViewProps) {
  const needsReview = result.status === EXTRACTION_STATUS.NEEDS_REVIEW

  return (
    <div className="flex flex-col gap-6">
      {needsReview && <NeedsReviewBanner />}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Invoice details</CardTitle>
            <ConfidenceBadge confidenceScore={result.confidenceScore} />
          </div>
        </CardHeader>
        <CardContent>
          <InvoiceDetails result={result} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
        </CardHeader>
        <CardContent>
          <LineItemsTable lineItemsJson={result.lineItems} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onProcessAnother}>Process another invoice</Button>
        <Button variant="outline" onClick={() => downloadResultAsCsv(result)}>
          Export as CSV
        </Button>
        <Button variant="outline" onClick={() => downloadResultAsXlsx(result)}>
          Export as Excel
        </Button>
      </div>
    </div>
  )
}
