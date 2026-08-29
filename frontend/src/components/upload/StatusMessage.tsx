import { Button } from '@/components/ui/button'

interface StatusMessageProps {
  tone: 'timeout' | 'error'
  message: string
  onRetry: () => void
}

export function StatusMessage({ tone, message, onRetry }: StatusMessageProps) {
  const isTimeout = tone === 'timeout'

  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-xl border px-8 py-16 text-center ${
        isTimeout ? 'border-warning/30 bg-warning/5' : 'border-danger/30 bg-danger/5'
      }`}
    >
      <p className="font-heading text-lg font-semibold text-text-primary">
        {isTimeout ? 'Still processing' : 'Something went wrong'}
      </p>
      <p className="max-w-sm text-sm text-text-secondary">{message}</p>
      <Button variant="outline" className="mt-2" onClick={onRetry}>
        Start over
      </Button>
    </div>
  )
}
