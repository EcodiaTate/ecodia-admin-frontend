import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

const spring = { type: 'spring' as const, stiffness: 280, damping: 22 }

export function AmbientPulse({ label, lastSyncAt, status }: AmbientPulseProps) {
  const [hovered, setHovered] = useState(false)

  const relativeTime = lastSyncAt
    ? formatDistanceToNow(new Date(lastSyncAt), { addSuffix: false })
    : null

  return (
    <motion.div
      layout
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="inline-flex items-center gap-2 rounded-xl px-2 py-1"
      transition={spring}
    >
      {/* Breathing dot */}
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

      {/* Compact: just relative time */}
      <span className="font-mono text-label-sm text-on-surface-muted/40">
        {relativeTime ? `${relativeTime}` : label}
      </span>

      {/* Expanded on hover */}
      <AnimatePresence>
        {hovered && lastSyncAt && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={spring}
            className="overflow-hidden whitespace-nowrap font-mono text-label-sm text-on-surface-muted/30"
          >
            · {label} · {new Date(lastSyncAt).toLocaleTimeString()}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
