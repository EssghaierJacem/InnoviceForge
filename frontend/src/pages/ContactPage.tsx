import { Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function ContactPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <p className="text-xs font-semibold tracking-widest text-primary uppercase">Contact</p>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight text-text-primary">Get in touch</h1>
      <p className="mt-4 text-text-secondary">
        Questions about the project, found a bug, or just want to talk through the architecture? Email
        directly — there's no support queue behind this, so a real person (me) reads it.
      </p>

      <Button asChild className="mt-8 rounded-full px-6">
        <a href="mailto:hello@invoiceforge.app" className="inline-flex items-center gap-2">
          <Mail size={16} aria-hidden="true" />
          hello@invoiceforge.app
        </a>
      </Button>

      <Link to="/" className="mt-8 block text-sm font-medium text-primary hover:underline">
        ← Back home
      </Link>
    </div>
  )
}
