import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getWorkerStatuses } from '@/api/workers'
import { useWorkerStore } from '@/store/workerStore'
import type { WorkerStatus } from '@/store/workerStore'

// Expected intervals in seconds — used to compute staleness
const EXPECTED_INTERVALS: Record<string, number> = {
  gmail: 3 * 60,              // 3 min
  finance: 4 * 60 * 60,       // 4 hr
  calendar: 5 * 60,           // 5 min
  linkedin: 4 * 60 * 60,      // 4 hr (DM check interval)
  google_drive: 6 * 60 * 60,  // 6 hr
  meta: 4 * 60 * 60,          // 4 hr
  vercel: 60 * 60,            // 1 hr
  codebase_index: 12 * 60 * 60, // 12 hr
  factory_schedule: 60 * 60,  // 1 hr
  kg_consolidation: 6 * 60 * 60, // 6 hr
  kg_embedding: 5 * 60,       // 5 min
}

function computeStaleness(ws: WorkerStatus): WorkerStatus {
  if (ws.status === 'error') return ws
  const interval = EXPECTED_INTERVALS[ws.worker] || 3600
  const elapsed = (Date.now() - new Date(ws.lastSync).getTime()) / 1000
  return {
    ...ws,
    status: elapsed > interval * 2.5 ? 'stale' : 'active',
  }
}

export function useWorkerStatus(workerName?: string) {
  const { setWorkers, workers } = useWorkerStore()

  const { data } = useQuery({
    queryKey: ['workerStatuses'],
    queryFn: getWorkerStatuses,
    // WS worker_heartbeat events update the store in real-time.
    // REST poll is ONLY for initial load + reconnect recovery.
    // No periodic refetch — WS is authoritative.
    staleTime: Infinity,
    refetchInterval: false,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (data) {
      const computed: Record<string, WorkerStatus> = {}
      for (const [key, ws] of Object.entries(data)) {
        computed[key] = computeStaleness(ws)
      }
      setWorkers(computed)
    }
  }, [data, setWorkers])

  if (workerName) {
    return workers[workerName] ?? null
  }
  return workers
}
