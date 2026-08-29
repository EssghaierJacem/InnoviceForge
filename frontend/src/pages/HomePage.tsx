import { Button } from '@/components/ui/button'

export function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-heading text-3xl font-semibold text-text-primary">
        Invoice processing, without the busywork
      </h1>
      <p className="mt-4 max-w-xl text-lg text-text-secondary">
        Upload an invoice and InvoiceForge extracts the vendor, amounts, and
        line items automatically — this page is a placeholder proving the
        design system renders correctly; the real upload flow lands in
        Stage 2.
      </p>
      <Button className="mt-8">Get started</Button>
    </div>
  )
}
