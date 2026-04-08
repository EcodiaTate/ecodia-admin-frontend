import { useQuery } from '@tanstack/react-query'
import { getFinanceSummary } from '@/api/finance'
import { getActionStats } from '@/api/actions'
import { getSystemVitals } from '@/api/symbridge'
import { getMomentum } from '@/api/momentum'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { EnergyWhisper } from '@/components/spatial/EnergyWhisper'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import type { WorkerStatus } from '@/store/workerStore'
import { ActionStream } from './ActionStream'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Flame, Rocket, FileCode, Cpu } from 'lucide-react'
import { Link } from 'react-router-dom'

// ─── Atmospheric Vitals ───────────────────────────────────────────────
//
// Not a dashboard. Not a report. Just the truth of the moment -
// a single number, the pulse of the system below it, and whatever
// the AI needs your attention on right now.
//
// You don't manage from here. You sense.

export default function DashboardPage() {
  const workers = useWorkerStatus() as Record<string, WorkerStatus>

  const { data: finance } = useQuery({
    queryKey: ['financeSummary'],
    queryFn: getFinanceSummary,
  })
  const { data: actionStats } = useQuery({
    queryKey: ['actionStats'],
    queryFn: getActionStats,
    // WS events invalidate this cache in real-time. Slow fallback only.
    refetchInterval: 120_000,
  })
  const { data: vitals } = useQuery({
    queryKey: ['systemVitals'],
    queryFn: getSystemVitals,
    retry: 1,
    refetchInterval: 30000,
  })
  const { data: momentum } = useQuery({
    queryKey: ['momentum'],
    queryFn: getMomentum,
    refetchInterval: 60_000,
  })

  const net = finance?.net ?? 0
  const systemHealthy = vitals?.healthy ?? false

  // Workers as a single pressure reading - fraction active
  const activeWorkers = Object.values(workers).filter(w => w.status === 'active').length
  const totalWorkers = Object.keys(workers).length
  const workerFraction = totalWorkers > 0 ? activeWorkers / totalWorkers : 1

  // Any errors in workers?
  const errorWorkers = Object.values(workers).filter(w => w.status === 'error').length

  return (
    <div className="mx-auto max-w-2xl flex flex-col items-center">

      {/* The number - hero, always */}
      <SpatialLayer z={25} className="flex flex-col items-center pt-[10vh]">
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 55, damping: 17, mass: 1.4 }}
          className={`font-display text-7xl font-light tabular-nums tracking-tight sm:text-[6.5rem] ${
            net >= 0 ? 'text-on-surface' : 'text-error/80'
          }`}
        >
          {formatCurrency(net)}
        </motion.p>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-muted/30"
        >
          Net · month to date
        </motion.span>
      </SpatialLayer>

      {/* System breath - not a status bar, just a pulse */}
      <SpatialLayer z={15} className="mt-12 mb-16 flex items-center gap-6">
        {/* System heartbeat */}
        <motion.div
          animate={systemHealthy ? {
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.7, 0.4],
          } : { opacity: 0.15 }}
          transition={systemHealthy ? {
            repeat: Infinity,
            duration: 2.4,
            ease: 'easeInOut',
          } : {}}
          className={`h-1.5 w-1.5 rounded-full ${systemHealthy ? 'bg-secondary' : 'bg-on-surface-muted/20'}`}
        />

        {/* Worker pressure - a single bar, not a grid */}
        <div className="flex items-center gap-2">
          <div className="h-px w-16 bg-on-surface-muted/10 overflow-hidden rounded-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${workerFraction * 100}%` }}
              transition={{ type: 'spring', stiffness: 60, damping: 20, delay: 0.5 }}
              className={`h-full rounded-full ${errorWorkers > 0 ? 'bg-error/40' : 'bg-secondary/30'}`}
            />
          </div>
          <span className="font-mono text-[10px] text-on-surface-muted/25">
            {activeWorkers}/{totalWorkers}
          </span>
        </div>

        {/* Activity today - only shown if there's something to say */}
        {actionStats && actionStats.executed_24h > 0 && (
          <span className="font-mono text-[10px] text-on-surface-muted/25">
            {actionStats.executed_24h} done today
          </span>
        )}

        {/* Claude energy — ambient, expands on hover */}
        <EnergyWhisper />
      </SpatialLayer>

      {/* Momentum tracker — recent Factory activity */}
      {momentum && (
        <SpatialLayer z={12} className="mb-10 w-full">
          <Link to="/momentum" className="block">
            <GlassPanel depth="surface" className="px-5 py-4 transition-all hover:ring-1 hover:ring-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-on-surface-muted/30">
                  Momentum — 7 days
                </h3>
                <span className="font-mono text-[10px] text-on-surface-muted/20">→</span>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="flex items-center gap-2">
                  <Flame className="h-3 w-3 text-gold/50" strokeWidth={1.5} />
                  <span className="font-display text-lg font-light tabular-nums text-on-surface/70">
                    {momentum.summary.complete}
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-muted/25">
                    {momentum.summary.successRate != null && `${momentum.summary.successRate}%`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Rocket className="h-3 w-3 text-secondary/50" strokeWidth={1.5} />
                  <span className="font-display text-lg font-light tabular-nums text-on-surface/70">
                    {momentum.summary.deployed}
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-muted/25">deployed</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCode className="h-3 w-3 text-tertiary/50" strokeWidth={1.5} />
                  <span className="font-display text-lg font-light tabular-nums text-on-surface/70">
                    {momentum.summary.filesChanged}
                  </span>
                  <span className="font-mono text-[10px] text-on-surface-muted/25">files</span>
                </div>
                {momentum.health?.ecodiaos && (
                  <div className="flex items-center gap-2">
                    <Cpu className="h-3 w-3 text-on-surface-muted/30" strokeWidth={1.5} />
                    <span className="font-mono text-lg font-light tabular-nums text-on-surface/70">
                      {momentum.health.ecodiaos.cpu != null ? `${Math.round(momentum.health.ecodiaos.cpu)}%` : '—'}
                    </span>
                    <span className="font-mono text-[10px] text-on-surface-muted/25">cpu</span>
                  </div>
                )}
              </div>
            </GlassPanel>
          </Link>
        </SpatialLayer>
      )}

      {/* The system's voice - pending decisions, if any */}
      {actionStats && actionStats.pending > 0 && (
        <SpatialLayer z={10} className="w-full">
          {/* Header whisper - the system speaking, not a section title */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-4 pl-5 font-mono text-[10px] uppercase tracking-[0.15em] text-on-surface-muted/25"
          >
            {actionStats.pending === 1
              ? 'One thing needs you'
              : `${actionStats.pending} things need you`}
          </motion.p>
          <ActionStream />
        </SpatialLayer>
      )}

      {/* All clear - when the system has nothing pending */}
      {actionStats && actionStats.pending === 0 && (
        <SpatialLayer z={5}>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-on-surface-muted/20"
          >
            The system is running. Nothing needs you right now.
          </motion.p>
        </SpatialLayer>
      )}
    </div>
  )
}
