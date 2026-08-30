import { useEffect, useRef, useState } from 'react'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { Button } from '@/components/ui/button'

export function AuthControls() {
  const auth = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Click-outside instead of onBlur: onBlur fires the instant focus leaves
  // the toggle button (i.e. on mousedown on a menu item), racing the
  // item's own click — a real bug where "Dashboard" would sometimes just
  // close the menu instead of navigating. This only closes on a genuine
  // click outside the menu, so a click on a menu item always gets there.
  useEffect(() => {
    if (!menuOpen) {
      return
    }
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  if (auth.isLoading) {
    return null
  }

  if (!auth.isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="outline" className="rounded-full" onClick={() => auth.signinRedirect()}>
          Log in
        </Button>
        <Button asChild className="rounded-full">
          <Link to="/signup">Register</Link>
        </Button>
      </div>
    )
  }

  const displayName = auth.user?.profile.name ?? auth.user?.profile.email ?? 'Account'
  const email = auth.user?.profile.email
  const showEmailLine = email && email !== displayName

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className="flex items-center gap-2 rounded-full bg-card-accent-2 px-4 py-2 text-sm font-medium text-card-accent-2-foreground transition-colors hover:bg-card-accent-2/80"
      >
        {displayName}
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface py-1.5 shadow-lg">
          <div className="px-3.5 py-2">
            <p className="truncate text-sm font-medium text-text-primary">{displayName}</p>
            {showEmailLine && <p className="truncate text-xs text-text-secondary">{email}</p>}
          </div>

          <div className="border-t border-border" />

          <Link
            to="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="mt-1 flex items-center gap-2.5 px-3.5 py-2 text-sm text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
          >
            <LayoutDashboard size={15} aria-hidden="true" />
            Dashboard
          </Link>
          <button
            type="button"
            onClick={() => auth.signoutRedirect()}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/10"
          >
            <LogOut size={15} aria-hidden="true" />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
