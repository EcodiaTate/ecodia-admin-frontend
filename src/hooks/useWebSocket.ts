import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useNotificationStore } from '@/store/notificationStore'
import { useCortexStore } from '@/store/cortexStore'
import { useWorkerStore } from '@/store/workerStore'
import type { CCSession } from '@/types/claudeCode'
import api from '@/api/client'

/**
 * Connection state — drives the ambient offline indicator.
 * Dispatched as a CustomEvent so any component can listen without re-renders.
 */
function setConnectionState(state: 'connected' | 'connecting' | 'disconnected') {
  window.dispatchEvent(new CustomEvent('ecodia:connection-state', { detail: state }))
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null)
  const token = useAuthStore((s) => s.token)
  const addNotification = useNotificationStore((s) => s.addNotification)
  const updateWorker = useWorkerStore((s) => s.updateWorker)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) return

    let attempt = 0
    let mounted = true

    async function connect() {
      if (!mounted) return
      setConnectionState('connecting')

      try {
        const { data } = await api.post('/auth/ws-ticket')
        const wsBase = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
        const ws = new WebSocket(`${wsBase}/ws?ticket=${data.ticket}`)

        ws.onopen = () => {
          attempt = 0
          wsRef.current = ws
          setConnectionState('connected')
        }

        ws.onmessage = (event) => {
          const msg = JSON.parse(event.data)
          const cortex = useCortexStore.getState()

          switch (msg.type) {
            case 'notification':
              addNotification(msg.payload)
              break

            // ─── CC Session Output ────────────────────────────────
            case 'cc:output': {
              const chunk = typeof msg.data === 'string' ? msg.data : JSON.stringify(msg.data)
              cortex.appendCCOutput(msg.sessionId, chunk)
              window.dispatchEvent(new CustomEvent('ecodia:cc-session-update', { detail: { sessionId: msg.sessionId, type: 'output' } }))
              break
            }

            // ─── CC Session Status Changes ────────────────────────
            case 'cc:status': {
              const newStatus = msg.data?.status ?? msg.data
              const statusUpdate = { status: newStatus }
              cortex.updateCCSession(msg.sessionId, statusUpdate)
              window.dispatchEvent(new CustomEvent('ecodia:cc-session-update', { detail: { sessionId: msg.sessionId, type: 'status', status: newStatus } }))

              if (newStatus === 'complete' || newStatus === 'error') {
                cortex.pushAmbientEvent({
                  kind: newStatus === 'complete' ? 'cc_complete' : 'cc_error',
                  summary: `CC session ${newStatus}: ${msg.sessionId}`,
                  detail: JSON.stringify(msg.data),
                })
              }
              // Always invalidate session list on status change
              queryClient.invalidateQueries({ queryKey: ['ccSessions'] })
              break
            }

            // ─── CC Pipeline Stage ────────────────────────────────
            case 'cc:stage': {
              const stageUpdate = { pipeline_stage: msg.data?.stage }
              cortex.updateCCSession(msg.sessionId, stageUpdate)
              queryClient.invalidateQueries({ queryKey: ['ccSessions'] })
              window.dispatchEvent(new CustomEvent('ecodia:cc-session-update', { detail: { sessionId: msg.sessionId, type: 'stage', stage: msg.data?.stage } }))
              break
            }

            // ─── CC Pipeline Result (was dead — now handled) ──────
            case 'cc:pipeline_result': {
              const result = msg.data ?? msg.payload
              const statusUpdate = {
                status: (result?.success ? 'complete' : 'error') as CCSession['status'],
                pipeline_stage: (result?.success ? 'deployed' : 'error') as CCSession['pipeline_stage'],
                confidence_score: result?.confidence ?? null,
                commit_sha: result?.commitSha ?? null,
              }
              cortex.updateCCSession(msg.sessionId, statusUpdate)
              cortex.pushAmbientEvent({
                kind: result?.success ? 'cc_deployed' : 'cc_deploy_failed',
                summary: result?.success
                  ? `Deployed: ${result.commitSha?.slice(0, 8) ?? 'committed'} (confidence: ${((result.confidence ?? 0) * 100).toFixed(0)}%)`
                  : `Deploy failed: ${result?.error ?? 'unknown'}`,
                detail: JSON.stringify(result),
              })
              queryClient.invalidateQueries({ queryKey: ['ccSessions'] })
              window.dispatchEvent(new CustomEvent('ecodia:cc-session-update', { detail: { sessionId: msg.sessionId, type: 'pipeline_result' } }))
              break
            }

            // ─── CC Session Created (was dead — now handled) ──────
            case 'cc:session_created': {
              const session = msg.data ?? msg.payload
              if (session?.id) {
                cortex.registerCCSession(session)
                cortex.pushAmbientEvent({
                  kind: 'cc_started',
                  summary: `New session: ${session.prompt?.slice(0, 80) ?? session.id}`,
                  detail: JSON.stringify(session),
                })
                queryClient.invalidateQueries({ queryKey: ['ccSessions'] })
                window.dispatchEvent(new CustomEvent('ecodia:cc-session-update', { detail: { sessionId: session.id, type: 'created' } }))
              }
              break
            }

            // ─── Worker Heartbeats ────────────────────────────────
            case 'worker_heartbeat':
              updateWorker(msg.payload)
              break

            // ─── Action Queue Events ──────────────────────────────
            case 'action_queue:new':
            case 'action_queue:updated':
            case 'action_queue:executed':
            case 'action_queue:dismissed':
              // Invalidate React Query cache so ActionStream re-fetches
              queryClient.invalidateQueries({ queryKey: ['pendingActions'] })
              queryClient.invalidateQueries({ queryKey: ['actionStats'] })
              window.dispatchEvent(new CustomEvent('ecodia:action-queue-update', { detail: msg }))
              break

            // ─── Action Queue Expired (was dead — now handled) ────
            case 'action_queue:expired':
              queryClient.invalidateQueries({ queryKey: ['pendingActions'] })
              queryClient.invalidateQueries({ queryKey: ['actionStats'] })
              cortex.pushAmbientEvent({
                kind: 'action_expired',
                summary: `Action expired: ${msg.payload?.title ?? 'item removed from queue'}`,
              })
              break

            // ─── Metabolic Pressure ───────────────────────────────
            case 'metabolic_pressure':
              window.dispatchEvent(new CustomEvent('ecodia:metabolic-pressure', { detail: msg.payload }))
              break

            // ─── Organism Surfacings ──────────────────────────────
            case 'cognitive_broadcast':
              window.dispatchEvent(new CustomEvent('ecodia:organism-surfacing', { detail: msg.payload }))
              break

            // ─── Self-Modification Proposals ──────────────────────
            case 'self_modification':
              window.dispatchEvent(new CustomEvent('ecodia:self-modification', { detail: msg.payload }))
              break
          }
        }

        ws.onclose = () => {
          if (mounted) {
            setConnectionState('disconnected')
            reconnect()
          }
        }
        ws.onerror = () => {
          if (mounted) {
            setConnectionState('disconnected')
            reconnect()
          }
        }
      } catch {
        if (mounted) {
          setConnectionState('disconnected')
          reconnect()
        }
      }
    }

    function reconnect() {
      if (!mounted) return
      const delay = Math.min(1000 * 2 ** attempt, 30_000)
      attempt++
      setTimeout(connect, delay)
    }

    connect()

    return () => {
      mounted = false
      wsRef.current?.close()
      setConnectionState('disconnected')
    }
  }, [token, addNotification, updateWorker, queryClient])
}
