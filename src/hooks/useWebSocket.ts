import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useCCSessionStore } from '@/store/ccSessionStore'
import { useCortexStore } from '@/store/cortexStore'
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
          const cortex = useCortexStore.getState()

          switch (msg.type) {
            case 'notification':
              addNotification(msg.payload)
              break

            case 'cc:output':
            case 'cc_output': {
              const chunk = typeof msg.data === 'string' ? msg.data : JSON.stringify(msg.data)
              // Feed both stores — ccSessionStore for the standalone Factory page,
              // cortexStore for any inline session blocks living in Cortex chat.
              appendOutput(msg.sessionId, chunk)
              cortex.appendCCOutput(msg.sessionId, chunk)
              break
            }

            case 'cc:status':
            case 'cc_status': {
              const newStatus = msg.data?.status ?? msg.data
              const statusUpdate = { status: newStatus }
              updateSession(msg.sessionId, statusUpdate)
              cortex.updateCCSession(msg.sessionId, statusUpdate)
              // When a session completes or errors, push an ambient event so the
              // Cortex can react (e.g. "the refactor completed, want me to review?")
              if (newStatus === 'complete' || newStatus === 'error') {
                cortex.pushAmbientEvent({
                  kind: newStatus === 'complete' ? 'cc_complete' : 'cc_error',
                  summary: `CC session ${newStatus}: ${msg.sessionId}`,
                  detail: JSON.stringify(msg.data),
                })
              }
              break
            }

            case 'worker_heartbeat':
              updateWorker(msg.payload)
              break

            case 'action_queue:new':
            case 'action_queue:updated':
            case 'action_queue:executed':
            case 'action_queue:dismissed':
              window.dispatchEvent(new CustomEvent('ecodia:action-queue-update', { detail: msg }))
              break

            case 'cc:stage': {
              const stageUpdate = { pipeline_stage: msg.data?.stage }
              updateSession(msg.sessionId, stageUpdate)
              cortex.updateCCSession(msg.sessionId, stageUpdate)
              break
            }

            case 'cc:session_created': {
              // Backend tells us a new CC session was created (e.g. triggered by Cortex
              // internally without going through the ActionCard approve flow).
              // Register it in cortexStore so inline blocks can find it.
              if (msg.session) {
                cortex.registerCCSession(msg.session)
              }
              break
            }
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
