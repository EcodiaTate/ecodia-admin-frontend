import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export function AmbientStatus() {
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="fixed right-4 top-4 z-40 flex items-center gap-2 md:right-6 md:top-5">
      <span className="mr-1 hidden font-display text-xs font-medium tracking-widest text-on-surface-muted/50 md:block">
        ECODIA OS
      </span>

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
  )
}
