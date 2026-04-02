import { useNotifications } from '@/hooks/useNotifications'
import { formatRelative } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { motion, AnimatePresence } from 'framer-motion'

export function ActivityFeed() {
  const { notifications } = useNotifications()
  // Show only the 5 most recent
  const visible = notifications.slice(0, 5)

  return (
    <div className="space-y-1">
      <AnimatePresence initial={false}>
        {visible.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.05 }}
            className="flex items-start gap-4 rounded-2xl px-4 py-3 transition-colors hover:bg-white/30"
          >
            <StatusBadge status={n.type} />
            <div className="flex-1">
              <p className="text-sm text-on-surface-variant">{n.message}</p>
              <p className="mt-1 font-mono text-label-sm text-on-surface-muted/40">{formatRelative(n.timestamp)}</p>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {notifications.length === 0 && (
        <p className="py-12 text-center text-sm text-on-surface-muted/40">
          Ecosystem quiet.
        </p>
      )}
    </div>
  )
}
