import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface AmbientPulseProps {
  label: string
  lastSyncAt?: string
  status: 'active' | 'error' | 'stale'
}

const DOT_COLORS = {
  active: 'bg-secondary',
  stale: 'bg-tertiary',
  error: 'bg-error',
}

export function AmbientPulse({ label, lastSyncAt, status }: AmbientPulseProps) {
  const relativeTime = lastSyncAt
    ? formatDistanceToNow(new Date(lastSyncAt), { addSuffix: false })
    : null

  return (
    <div className="inline-flex items-center gap-2 rounded-xl px-2 py-1">
      <span className="relative flex h-1.5 w-1.5">
        <span className={cn(
          'absolute inline-flex h-full w-full rounded-full opacity-60',
          DOT_COLORS[status],
          status === 'active' && 'animate-ping',
        )} />
        <span className={cn(
          'relative inline-flex h-1.5 w-1.5 rounded-full',
          DOT_COLORS[status],
        )} />
      </span>

      <span className="font-mono text-label-sm text-on-surface-muted/50">
        {label}
      </span>
      {relativeTime && (
        <span className="font-mono text-label-sm text-on-surface-muted/30">
          {relativeTime}
        </span>
      )}
    </div>
  )
}
