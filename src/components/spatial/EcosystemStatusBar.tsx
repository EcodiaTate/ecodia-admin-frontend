import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { getSystemVitals } from '@/api/symbridge'

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
function StatusDot({ state, healthy }: { state: ConnectionState; healthy: boolean }) {
  const color = state === 'disconnected'
    ? '#D97706'
    : state === 'connecting'
      ? '#5A6360'
      : healthy ? '#2ECC71' : '#5A6360'

  const shouldPulse = state === 'disconnected' || (state === 'connected' && healthy)

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
    queryKey: ['systemVitals'],
    queryFn: getSystemVitals,
    retry: 1,
    refetchInterval: 30000,
  })

  const conn = useConnectionState()
  const healthy = vitals?.healthy ?? false

  const healthLabel = conn === 'disconnected'
    ? 'Offline'
    : conn === 'connecting'
      ? 'Connecting'
      : !vitals ? 'Connecting' : healthy ? 'Optimal' : 'Degraded'

  const memoryMb = vitals?.memory?.heapUsed
  const activeSessions = vitals?.activeCCSessions

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 hidden items-center justify-between px-8 py-3 md:flex pointer-events-none">
      {/* Left: connection health */}
      <div className="flex items-center gap-3">
        <StatusDot state={conn} healthy={healthy} />
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-on-surface-muted/35">
          {healthLabel}
        </span>
      </div>

      {/* Right: ambient metrics */}
      <div className="flex items-center gap-6">
        {activeSessions != null && activeSessions > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-[0.10em]" style={{ color: 'rgba(27,122,61,0.50)' }}>
            {activeSessions} session{activeSessions > 1 ? 's' : ''}
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
