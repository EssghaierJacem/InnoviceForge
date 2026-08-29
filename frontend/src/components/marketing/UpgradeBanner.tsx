import { RevealSection } from '@/components/marketing/RevealSection'
import { SectionBand } from '@/components/marketing/SectionBand'
import { Button } from '@/components/ui/button'

export function UpgradeBanner() {
  return (
    <SectionBand
      tone="primary"
      className="bg-gradient-to-br from-primary to-primary-hover"
      innerClassName="mx-auto max-w-2xl px-6 py-16 text-center sm:py-20"
    >
      <RevealSection>
        <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Want unlimited scans?</h2>
        <p className="mx-auto mt-3 max-w-md text-on-dark/80">
          The Pro plan removes the daily limit and keeps a permanent record of every invoice you process.
        </p>
        <Button asChild className="mt-6 rounded-full bg-background px-6 text-primary hover:bg-background/90">
          <a href="#pricing">See pricing</a>
        </Button>
      </RevealSection>
    </SectionBand>
  )
}
