import { cn } from '@/lib/utils'

const colorMap: Record<string, string> = {
  // Transaction
  uncategorized: 'bg-tertiary/10 text-tertiary',
  categorized: 'bg-secondary/10 text-secondary',
  reconciled: 'bg-primary/10 text-primary',
  // Email
  unread: 'bg-tertiary/10 text-tertiary',
  triaged: 'bg-primary/10 text-primary',
  replied: 'bg-secondary/10 text-secondary',
  archived: 'bg-on-surface-muted/10 text-on-surface-muted',
  // Priority
  urgent: 'bg-error/10 text-error',
  high: 'bg-tertiary/10 text-tertiary',
  normal: 'bg-on-surface-muted/10 text-on-surface-muted',
  medium: 'bg-on-surface-muted/10 text-on-surface-muted',
  low: 'bg-surface-container text-on-surface-muted',
  spam: 'bg-surface-container text-on-surface-muted',
  // CC Session
  initializing: 'bg-tertiary/10 text-tertiary',
  running: 'bg-primary/10 text-primary',
  awaiting_input: 'bg-primary-container/10 text-primary-container',
  complete: 'bg-secondary/10 text-secondary',
  error: 'bg-error/10 text-error',
  // Task
  open: 'bg-tertiary/10 text-tertiary',
  in_progress: 'bg-primary/10 text-primary',
  done: 'bg-secondary/10 text-secondary',
  cancelled: 'bg-on-surface-muted/10 text-on-surface-muted',
  // LinkedIn DM categories
  lead: 'bg-secondary/10 text-secondary',
  networking: 'bg-primary/10 text-primary',
  recruiter: 'bg-primary-container/10 text-primary-container',
  support: 'bg-primary/10 text-primary',
  personal: 'bg-tertiary/10 text-tertiary',
  drafting: 'bg-tertiary/10 text-tertiary',
  ignored: 'bg-surface-container text-on-surface-muted',
  // LinkedIn post status
  draft: 'bg-on-surface-muted/10 text-on-surface-muted',
  scheduled: 'bg-tertiary/10 text-tertiary',
  posted: 'bg-secondary/10 text-secondary',
  failed: 'bg-error/10 text-error',
  // LinkedIn connection
  pending: 'bg-tertiary/10 text-tertiary',
  accepted: 'bg-secondary/10 text-secondary',
  declined: 'bg-error/10 text-error',
  // Pipeline
  proposal: 'bg-tertiary/10 text-tertiary',
  contract: 'bg-tertiary/10 text-tertiary',
  development: 'bg-primary/10 text-primary',
  live: 'bg-secondary/10 text-secondary',
  ongoing: 'bg-secondary/10 text-secondary',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        colorMap[status] || 'bg-on-surface-muted/10 text-on-surface-muted',
        className,
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}
