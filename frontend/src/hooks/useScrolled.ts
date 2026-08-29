import { useEffect, useState } from 'react'

/** True once the page has scrolled past `threshold` pixels — drives the header's "lifted" state. */
export function useScrolled(threshold = 8) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > threshold)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [threshold])

  return isScrolled
}
