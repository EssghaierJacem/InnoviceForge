export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-6 text-sm text-text-secondary">
        © {new Date().getFullYear()} InvoiceForge. All rights reserved.
      </div>
    </footer>
  )
}
