import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  const conn = useConnectionState()

  const organismAlive = vitals ? vitals.organism.healthy !== false : false

  // Connection state overrides health label when not connected
  const healthLabel = conn === 'disconnected'
    ? 'Offline'
    : conn === 'connecting'
      ? 'Connecting'
      : !vitals ? 'Connecting' : organismAlive ? 'Optimal' : 'Degraded'

  const dotColor = conn === 'disconnected'
    ? 'bg-tertiary'
    : conn === 'connecting'
      ? 'bg-on-surface-muted/30'
      : organismAlive ? 'bg-secondary' : 'bg-on-surface-muted/30'

  const memoryMb = vitals?.ecodiaos?.memory?.heapUsed
  const latencyMs = vitals?.organism?.lastResponseMs

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 hidden items-center justify-between px-8 py-2.5 md:flex pointer-events-none">
      <div className="flex items-center gap-2">
        <span className="relative flex h-1.5 w-1.5">
          {conn === 'disconnected' && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-60 animate-ping" />
          )}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${dotColor}`} />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-on-surface-muted/40">
          Ecosystem Health: {healthLabel}
        </span>
      </div>

      <div className="flex items-center gap-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-on-surface-muted/30">
          Workers {activeCount}/{totalCount}
        </span>
        {latencyMs != null && (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-on-surface-muted/30">
            Latency {latencyMs}ms
          </span>
        )}
        {memoryMb != null && (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-on-surface-muted/30">
            Heap {memoryMb}MB
          </span>
        )}
      </div>
    </div>
  )
}
