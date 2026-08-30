import { FileQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-secondary">
        <span className="h-1.5 w-1.5 rounded-full bg-danger" aria-hidden="true" />
        0% confidence this page exists
      </span>

      <div className="mt-6 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FileQuestion size={28} aria-hidden="true" />
      </div>

      <h1 className="mt-6 font-heading text-4xl font-bold tracking-tight text-text-primary">404</h1>
      <p className="mt-3 text-text-secondary">
        We ran this URL through the pipeline and nothing came back structured. Whatever you were looking
        for either moved, never existed, or is flagged for review by whoever typed the address.
      </p>

      <Button asChild className="mt-8 rounded-full px-6">
        <Link to="/">Back to a page that scores higher</Link>
      </Button>
    </div>
  )
}
