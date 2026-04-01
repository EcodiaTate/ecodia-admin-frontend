import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useCCSessionStore } from '@/store/ccSessionStore'
import { useWorkerStore } from '@/store/workerStore'
import api from '@/api/client'

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const token = useAuthStore((s) => s.token)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const appendOutput = useCCSessionStore((s) => s.appendOutput)
  const updateSession = useCCSessionStore((s) => s.updateSession)
  const updateWorker = useWorkerStore((s) => s.updateWorker)

  useEffect(() => {
    if (!token) return

    let attempt = 0

    async function connect() {
      try {
        const { data } = await api.post('/auth/ws-ticket')
        const wsBase = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
        const ws = new WebSocket(`${wsBase}/ws?ticket=${data.ticket}`)

        ws.onopen = () => {
          attempt = 0
          wsRef.current = ws
        }

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data)
          switch (msg.type) {
            case 'notification':
              addNotification(msg.payload)
              break
            case 'cc_output':
              appendOutput(msg.sessionId, msg.data)
              break
            case 'cc_status':
              updateSession(msg.sessionId, { status: msg.data })
              break
            case 'worker_heartbeat':
              updateWorker(msg.payload)
              break
          }
        }

        ws.onclose = () => reconnect()
        ws.onerror = () => reconnect()
      } catch {
        reconnect()
      }
    }

    function reconnect() {
      const delay = Math.min(1000 * 2 ** attempt, 30_000)
      attempt++
      setTimeout(connect, delay)
    }

    connect()

    return () => {
      wsRef.current?.close()
    }
  }, [token, addNotification, appendOutput, updateSession, updateWorker])
}
