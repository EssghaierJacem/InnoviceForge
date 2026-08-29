import type { ReactNode } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { cn } from '@/lib/utils'

interface RevealSectionProps {
  children: ReactNode
  className?: string
}

/** Wraps a homepage section with a one-time fade-in-up as it enters the viewport. */
export function RevealSection({ children, className }: RevealSectionProps) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>()

  return (
    <div ref={ref} className={cn('scroll-reveal', isVisible && 'is-visible', className)}>
      {children}
    </div>
  )
}
