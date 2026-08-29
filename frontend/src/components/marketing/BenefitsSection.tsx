import { Gauge, Share2, Users } from 'lucide-react'
import { RevealSection } from '@/components/marketing/RevealSection'
import { SectionBand } from '@/components/marketing/SectionBand'
import { cn } from '@/lib/utils'

const BENEFITS = [
  {
    icon: Gauge,
    title: 'Confidence you can act on',
    body: "Each extraction is scored on whether the vendor and date were found and whether the totals reconcile with the line items. Results that fall short of that bar are flagged for review instead of being handed to you as if they were certain.",
    bg: 'bg-card-accent-1',
    fg: 'text-card-accent-1-foreground',
    iconBg: 'bg-card-accent-1-foreground/15',
  },
  {
    icon: Users,
    title: 'Built for more than one team',
    body: "Every invoice is scoped to a tenant at the database level, so separate accounts, clients, or teams never see each other's data. It's the same model whether you're one person or an organization.",
    bg: 'bg-card-accent-2',
    fg: 'text-card-accent-2-foreground',
    iconBg: 'bg-card-accent-2-foreground/10',
  },
  {
    icon: Share2,
    title: 'Export where you need it',
    body: 'Download results as CSV or Excel the moment they land, no extra steps. More export destinations are on the roadmap as the product grows.',
    bg: 'bg-card-accent-3',
    fg: 'text-card-accent-3-foreground',
    iconBg: 'bg-card-accent-3-foreground/10',
  },
] as const

export function BenefitsSection() {
  return (
    <SectionBand tone="default" innerClassName="mx-auto max-w-6xl px-6 py-20 sm:py-24">
      <RevealSection>
        <p className="text-center text-xs font-semibold tracking-widest text-primary uppercase">Key benefits</p>
        <h2 className="mt-3 text-center font-heading text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Why teams use InvoiceForge
        </h2>
        <p className="mx-auto mt-3 max-w-md text-center text-sm text-text-secondary">
          Three things that shape how the product actually works, not just how it looks.
        </p>
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className={cn('rounded-2xl p-7', benefit.bg, benefit.fg)}>
              <div className={cn('flex size-10 items-center justify-center rounded-full', benefit.iconBg)}>
                <benefit.icon size={18} aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-semibold">{benefit.title}</h3>
              <p className={cn('mt-2 text-sm', benefit.bg === 'bg-card-accent-1' ? 'opacity-85' : 'opacity-80')}>
                {benefit.body}
              </p>
            </div>
          ))}
        </div>
      </RevealSection>
    </SectionBand>
  )
}
