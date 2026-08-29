interface ProcessingStateProps {
  phase: 'uploading' | 'polling'
}

const COPY: Record<ProcessingStateProps['phase'], { title: string; subtitle: string }> = {
  uploading: {
    title: 'Uploading your invoice…',
    subtitle: 'Sending the file over.',
  },
  polling: {
    title: 'Reading your invoice…',
    subtitle: 'Our extraction pipeline is pulling out the vendor, amounts, and line items. Usually takes a few seconds.',
  },
}

export function ProcessingState({ phase }: ProcessingStateProps) {
  const { title, subtitle } = COPY[phase]

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface px-8 py-16 text-center">
      <div className="relative h-1.5 w-40 overflow-hidden rounded-full bg-border">
        <div className="animate-processing-sweep absolute inset-y-0 w-1/3 rounded-full bg-primary" />
      </div>
      <div>
        <p className="font-heading text-lg font-semibold text-text-primary">{title}</p>
        <p className="mt-1 max-w-xs text-sm text-text-secondary">{subtitle}</p>
      </div>
    </div>
  )
}
