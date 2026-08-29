import { RevealSection } from '@/components/marketing/RevealSection'
import { SectionBand } from '@/components/marketing/SectionBand'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    title: 'Upload your invoice',
    body: 'Drop in any PDF, JPG, or PNG — typed, scanned, or a phone photo. No account or template needed.',
  },
  {
    title: 'AI extracts the data',
    body: 'A vision-capable AI model reads the document and pulls out the vendor, dates, amounts, and line items.',
  },
  {
    title: 'Review and export',
    body: 'Results come back with a confidence score. Anything that looks uncertain is flagged for review before you export to CSV or Excel.',
  },
] as const

export function HowItWorks() {
  return (
    <SectionBand tone="surface">
      <RevealSection>
        <div className="grid grid-cols-1 items-center gap-y-12 lg:grid-cols-2 lg:gap-x-16">
          <div>
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">How it works</p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
              How the extraction actually works
            </h2>
            <p className="mt-4 max-w-sm text-sm text-text-secondary">
              Every invoice runs through the same three-step pipeline, from the moment it lands to the moment
              structured, reviewable data comes back out.
            </p>
          </div>

          <ol className="flex flex-col lg:border-l lg:border-border lg:pl-14">
            {STEPS.map((step, index) => (
              <TimelineStep key={step.title} index={index + 1} isLast={index === STEPS.length - 1} {...step} />
            ))}
          </ol>
        </div>
      </RevealSection>
    </SectionBand>
  )
}

function TimelineStep({
  index,
  title,
  body,
  isLast,
}: (typeof STEPS)[number] & { index: number; isLast: boolean }) {
  // Fires once the step is ~70% of the way up the viewport, not fully
  // centered — gives the fill a beat to land before the reader's eye
  // actually reaches it.
  const { ref, isVisible } = useScrollReveal<HTMLLIElement>({
    rootMargin: '0px 0px -35% 0px',
    threshold: 0,
  })

  return (
    <li ref={ref} className="grid grid-cols-[auto_1fr] gap-x-6">
      <div className="flex flex-col items-center">
        <span
          className={cn(
            'flex size-16 shrink-0 items-center justify-center rounded-full font-heading text-xl font-semibold transition-colors duration-[350ms]',
            isVisible ? 'bg-primary text-on-dark' : 'border-2 border-border bg-surface text-text-secondary',
          )}
        >
          {index}
        </span>
        {!isLast && (
          <span
            className={cn('mt-1 w-px flex-1 transition-colors duration-700', isVisible ? 'bg-primary' : 'bg-border')}
          />
        )}
      </div>
      <div className="pb-16">
        <h3 className="pt-4 font-heading text-lg font-semibold text-text-primary">{title}</h3>
        <p className="mt-1.5 text-sm text-text-secondary">{body}</p>
      </div>
    </li>
  )
}
