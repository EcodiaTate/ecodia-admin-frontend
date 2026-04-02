import { useNotifications } from '@/hooks/useNotifications'
import { formatRelative } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, Mail, CircleDollarSign, Linkedin, Terminal, Cog } from 'lucide-react'
import type { Notification } from '@/store/notificationStore'

const TYPE_ICON: Record<Notification['type'], typeof Bell> = {
  email: Mail,
  task: Check,
  finance: CircleDollarSign,
  linkedin: Linkedin,
  cc: Terminal,
  system: Cog,
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()

  return (
    <div className="mx-auto max-w-3xl">
      <SpatialLayer z={25} className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
            Ambient Flux
          </span>
          <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
            System <em className="not-italic font-normal text-primary">Pulsations</em>
          </h1>
        </div>

        <div className="flex flex-wrap gap-4 sm:gap-6 sm:pt-2">
          <WhisperStat label="Unread" value={unreadCount} accent="text-primary" />
          <WhisperStat label="Total" value={notifications.length} />
        </div>
      </SpatialLayer>

      {unreadCount > 0 && (
        <SpatialLayer z={15} className="mb-8">
          <button
            onClick={markAllRead}
            className="rounded-2xl bg-primary/10 px-5 py-2.5 text-sm font-medium text-primary hover:bg-primary/15"
          >
            Mark all read
          </button>
        </SpatialLayer>
      )}

      <SpatialLayer z={-5}>
        <div className="space-y-1">
          <AnimatePresence initial={false}>
            {notifications.map((n, i) => {
              const Icon = TYPE_ICON[n.type] || Bell
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.03 }}
                  onClick={() => !n.read && markRead(n.id)}
                  className={`flex items-start gap-4 rounded-2xl px-5 py-4 ${!n.read ? 'bg-white/30 cursor-pointer' : ''} hover:bg-white/25`}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-container-low/60">
                    <Icon className="h-3.5 w-3.5 text-on-surface-muted" strokeWidth={1.75} />
                    {!n.read && (
                      <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary-container" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!n.read ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>
                      {n.message}
                    </p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="font-mono text-label-sm text-on-surface-muted/40">
                        {formatRelative(n.timestamp)}
                      </span>
                      <StatusBadge status={n.type} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {notifications.length === 0 && (
            <div className="py-24 text-center">
              <Bell className="mx-auto h-6 w-6 text-on-surface-muted/20" strokeWidth={1.5} />
              <p className="mt-4 text-sm text-on-surface-muted/40">
                Ecosystem quiet.
              </p>
            </div>
          )}
        </div>
      </SpatialLayer>
    </div>
  )
}
