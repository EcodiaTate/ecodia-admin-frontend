import { useQuery } from '@tanstack/react-query'
import { getFinanceSummary } from '@/api/finance'
import { getActionStats } from '@/api/actions'
import { getOrganismVitals } from '@/api/symbridge'
import { AmbientPulse } from '@/components/spatial/AmbientPulse'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import type { WorkerStatus } from '@/store/workerStore'
import { ActionStream } from './ActionStream'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Heart } from 'lucide-react'

export default function DashboardPage() {
  const workers = useWorkerStatus() as Record<string, WorkerStatus>

  const { data: finance } = useQuery({ queryKey: ['financeSummary'], queryFn: getFinanceSummary })
  const { data: actionStats } = useQuery({ queryKey: ['actionStats'], queryFn: getActionStats, refetchInterval: 60000 })
  const { data: vitals } = useQuery({ queryKey: ['organismVitals'], queryFn: getOrganismVitals, retry: 1, refetchInterval: 30000 })

  const net = finance?.net ?? 0
  const organismAlive = vitals?.organism?.status === 'alive'

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header — hero net figure as the one story */}
      <SpatialLayer z={25} className="mb-16">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
              Ecosystem Overview
            </span>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 70, damping: 18, mass: 1.2 }}
              className={`mt-4 font-display text-4xl font-light tabular-nums sm:text-display-lg ${
                net >= 0 ? 'text-secondary' : 'text-error'
              }`}
            >
              {formatCurrency(net)}
            </motion.p>
            <span className="mt-2 block text-label-sm uppercase tracking-[0.08em] text-on-surface-muted/40">
              Net · month to date
            </span>
          </div>

          {/* Organism heartbeat — ambient, no controls */}
          <div className="flex flex-col items-end gap-3 pt-2">
            <div className="flex items-center gap-2">
              <motion.div
                animate={organismAlive ? {
                  scale: [1, 1.15, 1],
                  opacity: [0.5, 1, 0.5],
                } : {}}
                transition={organismAlive ? {
                  duration: 2,
                  repeat: Infinity,
                  ease: [0.42, 0, 0.58, 1],
                } : {}}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${organismAlive ? 'text-secondary' : 'text-on-surface-muted/20'}`}
                  strokeWidth={1.75}
                  fill={organismAlive ? 'currentColor' : 'none'}
                />
              </motion.div>
              <span className={`text-[10px] font-medium uppercase tracking-wider ${
                organismAlive ? 'text-secondary/60' : 'text-on-surface-muted/20'
              }`}>
                {organismAlive ? 'Alive' : 'Offline'}
              </span>
            </div>

            {/* Worker pulses — ambient sync awareness */}
            <div className="flex flex-wrap justify-end gap-2">
              {Object.entries(workers).map(([key, w]) => (
                <AmbientPulse key={key} label={key} lastSyncAt={w.lastSync} status={w.status} />
              ))}
            </div>
          </div>
        </div>
      </SpatialLayer>

      {/* System activity — what the system needs a human decision on */}
      {actionStats && actionStats.pending > 0 && (
        <SpatialLayer z={10} className="mb-16">
          <ActionStream />
        </SpatialLayer>
      )}

      {/* What the system has done — ambient summary */}
      {actionStats && (actionStats.executed_24h > 0 || actionStats.dismissed_24h > 0) && (
        <SpatialLayer z={-10}>
          <div className="flex items-center gap-6 text-sm text-on-surface-muted/40">
            {actionStats.executed_24h > 0 && (
              <span>
                <span className="font-mono text-on-surface-variant">{actionStats.executed_24h}</span> actions executed today
              </span>
            )}
            {actionStats.dismissed_24h > 0 && (
              <span>
                <span className="font-mono text-on-surface-variant">{actionStats.dismissed_24h}</span> dismissed
              </span>
            )}
          </div>
        </SpatialLayer>
      )}
    </div>
  )
}
