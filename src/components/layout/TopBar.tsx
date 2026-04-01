import { Bell, LogOut, Search } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuthStore } from '@/store/authStore'

export function TopBar() {
  const { unreadCount, markAllRead } = useNotifications()
  const logout = useAuthStore((s) => s.logout)

  return (
    <header className="relative z-20 flex h-14 items-center justify-between bg-surface/90 px-10 lg:px-16">
      <div className="flex items-center gap-2">
        <span className="font-display text-sm font-medium tracking-wide text-on-surface">
          Ecodia OS
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button className="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-muted transition-colors hover:bg-surface-container hover:text-on-surface-variant">
          <Search className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <button
          onClick={markAllRead}
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-muted transition-colors hover:bg-surface-container hover:text-on-surface-variant"
        >
          <Bell className="h-4 w-4" strokeWidth={1.75} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary-container text-[9px] font-semibold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={logout}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-on-surface-muted transition-colors hover:bg-surface-container hover:text-on-surface-variant"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </header>
  )
}
