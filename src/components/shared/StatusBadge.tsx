import { cn } from '@/lib/utils'

const colorMap: Record<string, string> = {
  // Transaction
  uncategorized: 'bg-yellow-500/20 text-yellow-400',
  categorized: 'bg-green-500/20 text-green-400',
  reconciled: 'bg-blue-500/20 text-blue-400',
  // Email
  unread: 'bg-yellow-500/20 text-yellow-400',
  triaged: 'bg-blue-500/20 text-blue-400',
  replied: 'bg-green-500/20 text-green-400',
  archived: 'bg-zinc-500/20 text-zinc-400',
  // Priority
  urgent: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  normal: 'bg-zinc-500/20 text-zinc-400',
  medium: 'bg-zinc-500/20 text-zinc-400',
  low: 'bg-zinc-500/20 text-zinc-500',
  spam: 'bg-zinc-700/20 text-zinc-600',
  // CC Session
  initializing: 'bg-yellow-500/20 text-yellow-400',
  running: 'bg-blue-500/20 text-blue-400',
  awaiting_input: 'bg-purple-500/20 text-purple-400',
  complete: 'bg-green-500/20 text-green-400',
  error: 'bg-red-500/20 text-red-400',
  // Task
  open: 'bg-yellow-500/20 text-yellow-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  done: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-zinc-500/20 text-zinc-500',
  // LinkedIn DM categories
  networking: 'bg-blue-500/20 text-blue-400',
  recruiter: 'bg-purple-500/20 text-purple-400',
  support: 'bg-cyan-500/20 text-cyan-400',
  personal: 'bg-pink-500/20 text-pink-400',
  drafting: 'bg-yellow-500/20 text-yellow-400',
  ignored: 'bg-zinc-700/20 text-zinc-600',
  // LinkedIn post status
  draft: 'bg-zinc-500/20 text-zinc-400',
  scheduled: 'bg-yellow-500/20 text-yellow-400',
  posted: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  // LinkedIn connection
  pending: 'bg-yellow-500/20 text-yellow-400',
  accepted: 'bg-green-500/20 text-green-400',
  declined: 'bg-red-500/20 text-red-400',
  // Pipeline
  lead: 'bg-zinc-500/20 text-zinc-400',
  proposal: 'bg-yellow-500/20 text-yellow-400',
  contract: 'bg-orange-500/20 text-orange-400',
  development: 'bg-blue-500/20 text-blue-400',
  live: 'bg-green-500/20 text-green-400',
  ongoing: 'bg-emerald-500/20 text-emerald-400',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        colorMap[status] || 'bg-zinc-500/20 text-zinc-400',
        className,
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  )
}
