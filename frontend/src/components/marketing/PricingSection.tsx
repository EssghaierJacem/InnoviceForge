import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { RevealSection } from '@/components/marketing/RevealSection'
import { SectionBand } from '@/components/marketing/SectionBand'
import { cn } from '@/lib/utils'

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    highlight: false,
    features: ['5 invoices per day', 'PDF, JPG, PNG uploads', 'Confidence scoring', 'CSV & Excel export'],
    cta: 'Start free',
    href: '/signup',
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/mo',
    highlight: true,
    features: [
      'Unlimited invoices',
      'Everything in Free',
      'Persistent invoice history',
      'Priority processing',
    ],
    cta: 'Upgrade to Pro',
    href: '/signup',
  },
  {
    name: 'Enterprise',
    price: 'Contact us',
    period: '',
    highlight: false,
    features: ['Everything in Pro', 'Multi-seat tenant management', 'SSO & custom retention', 'Dedicated support'],
    cta: 'Contact sales',
    href: 'mailto:sales@invoiceforge.app',
  },
] as const

export function PricingSection() {
  return (
    <SectionBand id="pricing" tone="surface">
      <RevealSection>
        <p className="text-center text-xs font-semibold tracking-widest text-primary uppercase">Pricing</p>
        <h2 className="mt-3 text-center font-heading text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Simple, honest pricing
        </h2>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-text-secondary">
          Start free, no credit card. Upgrade whenever the daily limit gets in your way.
        </p>
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:items-center">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                'relative flex flex-col rounded-2xl p-7',
                tier.highlight
                  ? 'bg-primary text-on-dark shadow-xl shadow-primary/25 ring-2 ring-primary/40 sm:-my-4 sm:py-9'
                  : 'border border-border bg-surface',
              )}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-background px-3 py-1 text-xs font-semibold text-primary shadow">
                  Most popular
                </span>
              )}
              <p className="font-heading text-lg font-semibold">{tier.name}</p>
              <p className="mt-2">
                <span className="font-heading text-3xl font-bold tracking-tight">{tier.price}</span>
                <span
                  className={cn('text-sm', tier.highlight ? 'text-on-dark/70' : 'text-text-secondary')}
                >
                  {tier.period}
                </span>
              </p>
              <ul className="mt-6 flex flex-col gap-2.5">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className={cn(
                      'flex items-start gap-2 text-sm',
                      tier.highlight ? 'text-on-dark/90' : 'text-text-secondary',
                    )}
                  >
                    <Check size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className={cn(
                  'mt-7 w-full rounded-full',
                  tier.highlight && 'bg-background text-primary hover:bg-background/90',
                )}
                variant={tier.highlight ? 'default' : 'outline'}
              >
                {tier.href.startsWith('mailto:') ? (
                  <a href={tier.href}>{tier.cta}</a>
                ) : (
                  <Link to={tier.href}>{tier.cta}</Link>
                )}
              </Button>
            </div>
          ))}
        </div>
      </RevealSection>
    </SectionBand>
  )
}
