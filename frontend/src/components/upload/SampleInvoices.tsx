import { RevealSection } from '@/components/marketing/RevealSection'
import { SAMPLE_HANDWRITTEN_INVOICE, SAMPLE_PROFESSIONAL_INVOICE } from '@/lib/sample-data'
import type { PublicExtractionResultDTO } from '@/types/api'
import { cn } from '@/lib/utils'

interface SampleInvoicesProps {
  onSampleSelected: (result: PublicExtractionResultDTO) => void
}

const SAMPLES = [
  {
    id: 'professional',
    result: SAMPLE_PROFESSIONAL_INVOICE,
    label: 'Professional invoice',
    description: 'Typed, structured format.',
    thumbnail: ProfessionalThumbnail,
  },
  {
    id: 'handwritten',
    result: SAMPLE_HANDWRITTEN_INVOICE,
    label: 'Handwritten invoice',
    description: 'Informal, hand-written style.',
    thumbnail: HandwrittenThumbnail,
  },
] as const

export function SampleInvoices({ onSampleSelected }: SampleInvoicesProps) {
  return (
    <RevealSection className="mx-auto mt-10 max-w-3xl">
      <p className="mb-3 text-center text-sm text-text-secondary">
        No file handy? Try a sample invoice instead
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => onSampleSelected(sample.result)}
            aria-label={`Try sample: ${sample.label}`}
            className={cn(
              'group flex items-center gap-4 rounded-2xl bg-primary/10 p-4 text-left',
              'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg',
            )}
          >
            <sample.thumbnail />
            <div>
              <p className="text-sm font-semibold text-text-primary">{sample.label}</p>
              <p className="mt-0.5 text-xs text-text-secondary">{sample.description}</p>
            </div>
          </button>
        ))}
      </div>
    </RevealSection>
  )
}

/** Self-made placeholder mockup — not a real invoice, no third-party asset. */
function ProfessionalThumbnail() {
  return (
    <svg viewBox="0 0 120 150" className="h-16 w-16 shrink-0 rounded-lg drop-shadow-sm" aria-hidden="true">
      <rect x="1" y="1" width="118" height="148" rx="4" fill="var(--color-surface)" stroke="var(--color-border)" />
      <rect x="12" y="14" width="40" height="6" rx="1.5" fill="var(--color-primary)" opacity="0.8" />
      <rect x="66" y="14" width="42" height="5" rx="1.5" fill="var(--color-text-secondary)" opacity="0.4" />
      <rect x="66" y="23" width="42" height="5" rx="1.5" fill="var(--color-text-secondary)" opacity="0.4" />
      <rect x="12" y="34" width="30" height="4" rx="1" fill="var(--color-text-secondary)" opacity="0.3" />
      <line x1="12" y1="48" x2="108" y2="48" stroke="var(--color-border)" strokeWidth="1" />
      {[58, 68, 78, 88].map((y) => (
        <g key={y}>
          <rect x="12" y={y} width="52" height="3.5" rx="1" fill="var(--color-text-secondary)" opacity="0.3" />
          <rect x="92" y={y} width="16" height="3.5" rx="1" fill="var(--color-text-secondary)" opacity="0.3" />
        </g>
      ))}
      <line x1="12" y1="102" x2="108" y2="102" stroke="var(--color-border)" strokeWidth="1" />
      <rect x="70" y="110" width="38" height="5" rx="1.5" fill="var(--color-text-primary)" opacity="0.5" />
      <rect x="70" y="120" width="38" height="6" rx="1.5" fill="var(--color-primary)" opacity="0.85" />
    </svg>
  )
}

/** Self-made placeholder mockup — not a real invoice, no third-party asset. */
function HandwrittenThumbnail() {
  return (
    <svg viewBox="0 0 120 150" className="h-16 w-16 shrink-0 rounded-lg drop-shadow-sm" aria-hidden="true">
      <rect x="1" y="1" width="118" height="148" rx="4" fill="var(--color-surface)" stroke="var(--color-border)" />
      <rect
        x="10"
        y="16"
        width="46"
        height="6"
        rx="1.5"
        fill="var(--color-warning)"
        opacity="0.7"
        transform="rotate(-2 10 16)"
      />
      <rect
        x="14"
        y="30"
        width="60"
        height="4"
        rx="1"
        fill="var(--color-text-secondary)"
        opacity="0.35"
        transform="rotate(1 14 30)"
      />
      <rect
        x="60"
        y="46"
        width="40"
        height="4"
        rx="1"
        fill="var(--color-text-secondary)"
        opacity="0.3"
        transform="rotate(-1.5 60 46)"
      />
      {[62, 74, 84].map((y, i) => (
        <rect
          key={y}
          x={16 + i * 3}
          y={y}
          width={44 - i * 4}
          height="3.5"
          rx="1"
          fill="var(--color-text-secondary)"
          opacity="0.3"
          transform={`rotate(${i % 2 === 0 ? -1 : 1.5} 30 ${y})`}
        />
      ))}
      <rect
        x="18"
        y="112"
        width="50"
        height="6"
        rx="1.5"
        fill="var(--color-text-primary)"
        opacity="0.45"
        transform="rotate(-2 18 112)"
      />
      <path d="M76 128 q6 -8 14 0 q6 8 12 -2" stroke="var(--color-primary)" strokeWidth="2" fill="none" opacity="0.8" />
    </svg>
  )
}
