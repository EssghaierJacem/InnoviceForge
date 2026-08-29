import { useEffect, useRef, useState } from 'react'

/**
 * Fires once when the element first enters the viewport, then disconnects.
 * Used to drive the fade-in-up entrance on marketing sections. Pass custom
 * IntersectionObserver options (e.g. a rootMargin) to change where the
 * trigger point sits — see HowItWorks's timeline steps for an example that
 * fires before the element is fully centered, rather than the default
 * "just entered the viewport" threshold.
 */
export function useScrollReveal<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      options ?? { threshold: 0.15 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, isVisible }
}
