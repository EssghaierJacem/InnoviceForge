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
}

export function QuotaExceededModal({ open, onDismiss }: QuotaExceededModalProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDismiss()}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>You've used today's free conversions</DialogTitle>
          <DialogDescription>
            Anonymous uploads are capped at 3 per day, and that resets tomorrow. A free account gets
            5 uploads a day, every day — no time limit, and it's the same fast extraction you just saw.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onDismiss}>
            Maybe later
          </Button>
          <Button asChild>
            <Link to="/signup">Sign up</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
