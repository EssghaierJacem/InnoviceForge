import { Link } from 'react-router-dom'

export function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="font-heading text-xl font-semibold text-text-primary">
          InvoiceForge
        </Link>
        <nav className="flex items-center gap-6 text-sm text-text-secondary">
          <span>Dashboard</span>
          <span>Invoices</span>
          <span>Settings</span>
        </nav>
      </div>
    </header>
  )
}
