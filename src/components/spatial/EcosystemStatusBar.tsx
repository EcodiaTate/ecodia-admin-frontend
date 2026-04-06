import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getOrganismVitals } from '@/api/symbridge'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import type { WorkerStatus } from '@/store/workerStore'

type ConnectionState = 'connected' | 'connecting' | 'disconnected'

function useConnectionState(): ConnectionState {
  const [state, setState] = useState<ConnectionState>('connecting')
  useEffect(() => {
    const handler = (e: Event) => setState((e as CustomEvent).detail)
    window.addEventListener('ecodia:connection-state', handler)
    return () => window.removeEventListener('ecodia:connection-state', handler)
  }, [])
  return state
}

/** Chromatic dot that pulses based on system state */
function StatusDot({ state, alive }: { state: ConnectionState; alive: boolean }) {
  const color = state === 'disconnected'
    ? '#D97706'
    : state === 'connecting'
      ? '#5A6360'
      : alive ? '#2ECC71' : '#5A6360'

  const shouldPulse = state === 'disconnected' || (state === 'connected' && alive)

  return (
    <span className="relative flex h-2 w-2">
      {shouldPulse && (
        <motion.span
          className="absolute inline-flex h-full w-full rounded-full"
          style={{ backgroundColor: color }}
          animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: state === 'disconnected' ? 1.5 : 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <span
        className="relative inline-flex h-2 w-2 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}40`,
        }}
      />
    </span>
  )
}

export function EcosystemStatusBar() {
  const { data: vitals } = useQuery({
    queryKey: ['organismVitals'],
    queryFn: getOrganismVitals,
    retry: 1,
    refetchInterval: 30000,
  })

  const workers = useWorkerStatus() as Record<string, WorkerStatus>
  const activeCount = Object.values(workers).filter(w => w.status === 'active').length
  const totalCount = Object.keys(workers).length
  const errorCount = Object.values(workers).filter(w => w.status === 'error').length
  const conn = useConnectionState()

  const organismAlive = vitals ? vitals.organism.healthy !== false : false

  const healthLabel = conn === 'disconnected'
    ? 'Offline'
    : conn === 'connecting'
      ? 'Connecting'
      : !vitals ? 'Connecting' : organismAlive ? 'Optimal' : 'Degraded'

  const memoryMb = vitals?.ecodiaos?.memory?.heapUsed
  const latencyMs = vitals?.organism?.lastResponseMs
  const activeSessions = vitals?.ecodiaos?.activeCCSessions

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 hidden items-center justify-between px-8 py-3 md:flex pointer-events-none">
      {/* Left: Ecosystem health */}
      <div className="flex items-center gap-3">
        <StatusDot state={conn} alive={organismAlive} />
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-on-surface-muted/35">
          {healthLabel}
        </span>
        {errorCount > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: 'rgba(220,38,38,0.50)' }}>
            {errorCount} error{errorCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Right: Ambient metrics */}
      <div className="flex items-center gap-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-on-surface-muted/25">
          <span style={{ color: activeCount === totalCount ? 'rgba(46,204,113,0.50)' : 'rgba(217,119,6,0.50)' }}>
            {activeCount}
          </span>
          <span className="text-on-surface-muted/15">/{totalCount} workers</span>
        </span>
        {activeSessions != null && activeSessions > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-[0.10em]" style={{ color: 'rgba(27,122,61,0.50)' }}>
            {activeSessions} session{activeSessions > 1 ? 's' : ''}
          </span>
        )}
        {latencyMs != null && (
          <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-on-surface-muted/20">
            {latencyMs}ms
          </span>
        )}
        {memoryMb != null && (
          <span className="font-mono text-[10px] uppercase tracking-[0.10em] text-on-surface-muted/20">
            {memoryMb}MB
          </span>
        )}
      </div>
    </div>
  )
}
