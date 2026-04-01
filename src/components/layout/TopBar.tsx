import { Bell, LogOut } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuthStore } from '@/store/authStore'

export function TopBar() {
  const { unreadCount, markAllRead } = useNotifications()
  const logout = useAuthStore((s) => s.logout)

  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6">
      <div />
      <div className="flex items-center gap-4">
        <button
          onClick={markAllRead}
          className="relative rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={logout}
          className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
