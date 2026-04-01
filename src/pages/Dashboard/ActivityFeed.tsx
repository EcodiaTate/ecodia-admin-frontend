import { useNotifications } from '@/hooks/useNotifications'
import { formatRelative } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { motion } from 'framer-motion'

export function ActivityFeed() {
  const { notifications } = useNotifications()

  return (
    <div>
      <h2 className="mb-8 text-label-md uppercase tracking-[0.05em] text-on-surface-muted">
        System Pulsations
      </h2>
      <div className="space-y-1">
        {notifications.slice(0, 10).map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i * 0.04 }}
            className="flex items-start gap-4 rounded-2xl px-5 py-4 transition-colors hover:bg-surface-container-low/50"
          >
            <StatusBadge status={n.type} />
            <div className="flex-1">
              <p className="text-sm text-on-surface-variant">{n.message}</p>
              <p className="mt-1 font-mono text-label-sm text-on-surface-muted">{formatRelative(n.timestamp)}</p>
            </div>
          </motion.div>
        ))}
        {notifications.length === 0 && (
          <p className="py-12 text-center text-sm text-on-surface-muted">
            Ecosystem quiet. No recent pulsations.
          </p>
        )}
      </div>
    </div>
  )
}
