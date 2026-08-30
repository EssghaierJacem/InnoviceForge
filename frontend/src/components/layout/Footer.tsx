import { Link } from 'react-router-dom'

const PRODUCT_LINKS = [
  { label: 'How it works', href: '/#top' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
] as const

const COMPANY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const

const LEGAL_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
] as const

export function Footer() {
  return (
    <footer className="bg-primary text-on-dark">
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Invoices go in messy. Structured, scored data comes out — ready for whichever team,
          tenant, or spreadsheet needs it next.
        </p>
      </div>

      <div className="mx-auto max-w-6xl border-t border-primary-foreground/15 px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-heading text-lg font-semibold">InvoiceForge</p>
            <p className="mt-2 max-w-xs text-sm text-on-dark/70">
              Structured invoice data in seconds, without the manual entry.
            </p>
          </div>

          <FooterColumn title="Product" links={PRODUCT_LINKS} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <div className="mt-12 border-t border-primary-foreground/15 pt-6 text-sm text-on-dark/70">
          © {new Date().getFullYear()} InvoiceForge. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: readonly { label: string; href: string }[]
}) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-wide text-on-dark uppercase">{title}</p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.href.startsWith('mailto:') || link.href.startsWith('/#') ? (
              <a href={link.href} className="text-sm text-on-dark/85 hover:text-on-dark">
                {link.label}
              </a>
            ) : (
              <Link to={link.href} className="text-sm text-on-dark/85 hover:text-on-dark">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
