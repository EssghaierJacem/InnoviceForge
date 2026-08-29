import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingBadgeProps {
  icon: LucideIcon
  children: React.ReactNode
  className?: string
  tone?: 'surface' | 'primary'
}

/** Small floating status-pill decoration, echoing a polished-product micro-detail. */
export function FloatingBadge({ icon: Icon, children, className, tone = 'surface' }: FloatingBadgeProps) {
  return (
    <div
      className={cn(
        'hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-lg sm:flex',
        tone === 'surface'
          ? 'border-border bg-surface text-text-primary'
          : 'border-transparent bg-primary text-primary-foreground',
        className,
      )}
    >
      <Icon size={13} className={tone === 'surface' ? 'text-primary' : ''} aria-hidden="true" />
      {children}
    </div>
  )
}
