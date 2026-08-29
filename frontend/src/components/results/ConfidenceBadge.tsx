interface ConfidenceBadgeProps {
  confidenceScore: number | null
}

export function ConfidenceBadge({ confidenceScore }: ConfidenceBadgeProps) {
  if (confidenceScore === null) {
    return null
  }

  const percent = Math.round(confidenceScore * 100)

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-text-secondary">
      <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
      {percent}% confidence
    </span>
  )
}
