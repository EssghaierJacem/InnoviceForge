import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useScrolled } from '@/hooks/useScrolled'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { label: 'Product', href: '/#top' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
] as const

export function Header() {
  const isScrolled = useScrolled(8)

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b bg-background transition-shadow duration-200',
        isScrolled ? 'border-border shadow-sm' : 'border-transparent',
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-10">
          <Link to="/" className="font-heading text-xl font-semibold text-text-primary">
            InvoiceForge
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-text-secondary sm:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.label} href={link.href} className="transition-colors hover:text-text-primary">
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <Button asChild className="rounded-full">
          <a href="/#top">Try it free</a>
        </Button>
      </div>
    </header>
  )
}
