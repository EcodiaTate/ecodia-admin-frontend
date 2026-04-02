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
import { Heart, Activity, Zap } from 'lucide-react'

export default function DashboardPage() {
  const workers = useWorkerStatus() as Record<string, WorkerStatus>

  const { data: finance } = useQuery({ queryKey: ['financeSummary'], queryFn: getFinanceSummary })
  const { data: actionStats } = useQuery({ queryKey: ['actionStats'], queryFn: getActionStats, refetchInterval: 60000 })
  const { data: vitals } = useQuery({ queryKey: ['organismVitals'], queryFn: getOrganismVitals, retry: 1, refetchInterval: 30000 })

  const net = finance?.net ?? 0
  // null = no organism configured, true = organism healthy — both mean system is alive
  const organismAlive = vitals ? vitals.organism.healthy !== false : false
  const activeWorkers = Object.values(workers).filter(w => w.status === 'active').length
  const totalWorkers = Object.keys(workers).length

  return (
    <div className="mx-auto max-w-3xl flex flex-col items-center">
      {/* Hero — single massive number, the one story */}
      <SpatialLayer z={25} className="mb-4 flex flex-col items-center pt-[8vh]">
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 60, damping: 18, mass: 1.4 }}
          className={`font-display text-7xl font-bold tabular-nums tracking-tight sm:text-[6rem] ${
            net >= 0 ? 'text-on-surface' : 'text-error'
          }`}
        >
          {formatCurrency(net)}
        </motion.p>
        <span className="mt-3 text-label-sm uppercase tracking-[0.15em] text-on-surface-muted/50">
          Net · month to date
        </span>
      </SpatialLayer>

      {/* Organism vitals strip — always visible, no hover */}
      <SpatialLayer z={15} className="mb-16 mt-8">
        <div className="flex items-center gap-8 text-on-surface-muted/50">
          <div className="flex items-center gap-2">
            <Heart
              className={`h-3 w-3 ${organismAlive ? 'text-secondary' : 'text-on-surface-muted/20'}`}
              strokeWidth={2}
              fill={organismAlive ? 'currentColor' : 'none'}
            />
            <span className="font-mono text-label-sm">
              {organismAlive ? 'Alive' : 'Offline'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="h-3 w-3 text-tertiary" strokeWidth={2} />
            <span className="font-mono text-label-sm">
              {activeWorkers}/{totalWorkers}
            </span>
          </div>

          {vitals?.organism?.lastResponseMs != null && (
            <div className="flex items-center gap-2">
              <Zap className="h-3 w-3 text-gold" strokeWidth={2} />
              <span className="font-mono text-label-sm">
                {vitals.organism.lastResponseMs}ms
              </span>
            </div>
          )}
        </div>
      </SpatialLayer>

      {/* Pending actions — the decisions that need a human */}
      {actionStats && actionStats.pending > 0 && (
        <SpatialLayer z={10} className="mb-12 w-full">
          <ActionStream />
        </SpatialLayer>
      )}

      {/* Worker pulses — ambient awareness at bottom */}
      <SpatialLayer z={-10} className="w-full">
        <div className="flex flex-wrap justify-center gap-4">
          {Object.entries(workers).map(([key, w]) => (
            <AmbientPulse key={key} label={key} lastSyncAt={w.lastSync} status={w.status} />
          ))}
        </div>

        {/* Activity summary */}
        {actionStats && (actionStats.executed_24h > 0 || actionStats.dismissed_24h > 0) && (
          <div className="mt-6 flex items-center justify-center gap-6 text-label-sm text-on-surface-muted/40">
            {actionStats.executed_24h > 0 && (
              <span>
                <span className="font-mono text-on-surface-variant">{actionStats.executed_24h}</span> executed today
              </span>
            )}
            {actionStats.dismissed_24h > 0 && (
              <span>
                <span className="font-mono text-on-surface-variant">{actionStats.dismissed_24h}</span> dismissed
              </span>
            )}
          </div>
        )}
      </SpatialLayer>
    </div>
  )
}
