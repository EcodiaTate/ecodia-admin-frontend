import { motion } from 'framer-motion'
import { Bell, LogOut, Search } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuthStore } from '@/store/authStore'

export function AmbientStatus() {
  const { unreadCount, markAllRead } = useNotifications()
  const logout = useAuthStore((s) => s.logout)

  return (
    <>
      {/* Top-right cluster: search + bell */}
      <div className="fixed right-6 top-5 z-40 flex items-center gap-2">
        {/* Ecodia OS wordmark */}
        <span className="mr-3 font-display text-xs font-medium tracking-widest text-on-surface-muted/50">
          ECODIA OS
        </span>

        <motion.button
          whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.4)' }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-muted/60 transition-colors hover:text-on-surface-variant"
        >
          <Search className="h-4 w-4" strokeWidth={1.75} />
        </motion.button>

        <motion.button
          onClick={markAllRead}
          whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.4)' }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-muted/60 transition-colors hover:text-on-surface-variant"
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary-container text-[8px] font-bold text-white shadow-glow-primary"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>

        <motion.button
          onClick={logout}
          whileHover={{ scale: 1.08, backgroundColor: 'rgba(255,255,255,0.4)' }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-muted/60 transition-colors hover:text-on-surface-variant"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
        </motion.button>
      </div>
    </>
  )
}
