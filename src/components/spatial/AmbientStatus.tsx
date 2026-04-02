import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Bell, Mail, Check, CircleDollarSign, Linkedin, Terminal, Cog } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNotifications } from '@/hooks/useNotifications'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatRelative } from '@/lib/utils'
import type { Notification } from '@/store/notificationStore'

const TYPE_ICON: Record<Notification['type'], typeof Bell> = {
  email: Mail,
  task: Check,
  finance: CircleDollarSign,
  linkedin: Linkedin,
  cc: Terminal,
  system: Cog,
}

const glide = { type: 'spring' as const, stiffness: 90, damping: 20, mass: 1 }

export function AmbientStatus() {
  const logout = useAuthStore((s) => s.logout)
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="fixed right-4 top-4 z-40 flex items-center gap-2 md:right-6 md:top-5">
        <span className="mr-1 hidden font-display text-xs font-medium tracking-widest text-on-surface-muted/50 md:block">
          ECODIA OS
        </span>

        {/* Bell with unread badge */}
        <motion.button
          onClick={() => setOpen(!open)}
          whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.4)' }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 150, damping: 18 }}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-muted/60 transition-colors hover:text-on-surface-variant"
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </motion.button>

        <motion.button
          onClick={logout}
          whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.4)' }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 150, damping: 18 }}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-muted/60 transition-colors hover:text-on-surface-variant"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
        </motion.button>
      </div>

      {/* Notification drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 24, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.97 }}
              transition={glide}
              className="fixed right-4 top-16 z-50 w-96 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-3xl md:right-6"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.70)',
                border: '1px solid rgba(255, 255, 255, 0.7)',
                boxShadow: '0 32px 64px -16px rgba(0, 104, 122, 0.06)',
              }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">
                      System Pulsations
                    </span>
                    {unreadCount > 0 && (
                      <span className="ml-3 text-label-sm text-primary font-medium">{unreadCount} unread</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <AnimatePresence initial={false}>
                    {notifications.slice(0, 20).map((n, i) => {
                      const Icon = TYPE_ICON[n.type] || Bell
                      return (
                        <motion.div
                          key={n.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.02 }}
                          onClick={() => !n.read && markRead(n.id)}
                          className={`flex items-start gap-3 rounded-2xl px-4 py-3 ${!n.read ? 'bg-white/40 cursor-pointer' : ''} hover:bg-white/30`}
                        >
                          <div className="relative mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-container-low/60">
                            <Icon className="h-3 w-3 text-on-surface-muted" strokeWidth={1.75} />
                            {!n.read && (
                              <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary-container" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${!n.read ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>
                              {n.message}
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="font-mono text-[10px] text-on-surface-muted/40">
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
                    <div className="py-12 text-center">
                      <Bell className="mx-auto h-5 w-5 text-on-surface-muted/20" strokeWidth={1.5} />
                      <p className="mt-3 text-xs text-on-surface-muted/40">Ecosystem quiet.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
