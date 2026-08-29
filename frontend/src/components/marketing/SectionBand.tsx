import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionBandProps {
  children: ReactNode
  tone?: 'default' | 'surface' | 'primary'
  className?: string
  innerClassName?: string
  id?: string
}

const TONE_CLASSES: Record<NonNullable<SectionBandProps['tone']>, string> = {
  default: 'bg-background',
  surface: 'bg-surface',
  primary: 'bg-primary text-on-dark',
}

/** Full-bleed color band used to break the homepage into distinct sections. */
export function SectionBand({ children, tone = 'default', className, innerClassName, id }: SectionBandProps) {
  return (
    <section id={id} className={cn('w-full', TONE_CLASSES[tone], className)}>
      <div className={cn('mx-auto max-w-5xl px-6 py-20 sm:py-24', innerClassName)}>{children}</div>
    </section>
  )
}
