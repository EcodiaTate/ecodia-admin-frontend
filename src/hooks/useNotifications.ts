import { useNotificationStore } from '@/store/notificationStore'

export function useNotifications() {
  const notifications = useNotificationStore((s) => s.notifications)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const markRead = useNotificationStore((s) => s.markRead)
  const markAllRead = useNotificationStore((s) => s.markAllRead)

  return { notifications, unreadCount, markRead, markAllRead }
}
