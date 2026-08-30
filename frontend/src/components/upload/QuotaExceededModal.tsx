import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface QuotaExceededModalProps {
  open: boolean
  onDismiss: () => void
  /** 'anonymous' (default) is the pre-login flow; 'authenticated' is the dashboard's Free-plan limit. */
  variant?: 'anonymous' | 'authenticated'
}

export function QuotaExceededModal({ open, onDismiss, variant = 'anonymous' }: QuotaExceededModalProps) {
  const isAuthenticated = variant === 'authenticated'

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDismiss()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            {isAuthenticated ? "You've used today's Free-plan uploads" : "You've used today's free conversions"}
          </DialogTitle>
          <DialogDescription>
            {isAuthenticated ? (
              "Free accounts get 5 uploads a day, and that resets tomorrow. Pro removes the daily limit entirely for $9/month — no more waiting on a reset."
            ) : (
              <>
                Anonymous uploads are capped at 3 per day, and that resets tomorrow. A free account gets
                5 uploads a day, every day — no time limit, and it's the same fast extraction you just saw.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onDismiss}>
            Maybe later
          </Button>
          <Button asChild>
            {isAuthenticated ? <a href="/#pricing">Upgrade to Pro</a> : <Link to="/signup">Sign up</Link>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
