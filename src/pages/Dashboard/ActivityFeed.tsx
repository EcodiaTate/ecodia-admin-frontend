import { useNotifications } from '@/hooks/useNotifications'
import { formatRelative } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'

export function ActivityFeed() {
  const { notifications } = useNotifications()

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
      <h2 className="mb-4 text-sm font-medium text-zinc-400">Recent Activity</h2>
      <div className="space-y-3">
        {notifications.slice(0, 10).map((n) => (
          <div key={n.id} className="flex items-start gap-3 text-sm">
            <StatusBadge status={n.type} />
            <div className="flex-1">
              <p className="text-zinc-300">{n.message}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{formatRelative(n.timestamp)}</p>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-sm text-zinc-500">No recent activity</p>
        )}
      </div>
    </div>
  )
}
