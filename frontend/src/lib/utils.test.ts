import { describe, expect, it } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('joins plain class names', () => {
    expect(cn('text-sm', 'font-medium')).toBe('text-sm font-medium')
  })

  it('drops falsy values', () => {
    expect(cn('block', false && 'hidden', undefined, null, 'text-primary')).toBe('block text-primary')
  })

  it('lets a later conflicting Tailwind class win over an earlier one', () => {
    // This is the whole reason cn exists instead of a plain clsx call —
    // without tailwind-merge, both classes would survive and the cascade
    // (not the prop order) would decide which one actually renders.
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
  })

  it('keeps unrelated utilities when resolving a conflict', () => {
    expect(cn('p-4 text-sm', 'text-lg')).toBe('p-4 text-lg')
  })
})
