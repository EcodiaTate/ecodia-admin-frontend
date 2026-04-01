import { useNotifications } from '@/hooks/useNotifications'
import { formatRelative } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassPanel } from '@/components/spatial/GlassPanel'

export function ActivityFeed() {
  const { notifications } = useNotifications()

  return (
    <GlassPanel depth="surface" className="p-6">
      <h2 className="mb-6 text-label-md uppercase tracking-[0.05em] text-on-surface-muted">
        System Pulsations
      </h2>
      <div className="space-y-1">
        <AnimatePresence initial={false}>
          {notifications.slice(0, 10).map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i * 0.03 }}
              className="flex items-start gap-4 rounded-2xl px-5 py-4 transition-colors hover:bg-surface-container-low/50"
            >
              <StatusBadge status={n.type} />
              <div className="flex-1">
                <p className="text-sm text-on-surface-variant">{n.message}</p>
                <p className="mt-1 font-mono text-label-sm text-on-surface-muted">{formatRelative(n.timestamp)}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {notifications.length === 0 && (
          <p className="py-12 text-center text-sm text-on-surface-muted">
            Ecosystem quiet. No recent pulsations.
          </p>
        )}
      </div>
    </GlassPanel>
  )
}
