/**
 * VitalsPanel — compact system vitals context panel embedded in Cortex.
 * Shows live financial hero, system health, worker status, and pending actions.
 * Absorbs the Dashboard page into the Cortex workspace.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { getFinanceSummary } from '@/api/finance'
import { getActionStats } from '@/api/actions'
import { getSystemVitals } from '@/api/symbridge'
import { getMomentum } from '@/api/momentum'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import { cn } from '@/lib/utils'
import {
  DollarSign, Activity, Cpu, Flame,
  ChevronRight, ChevronDown, AlertTriangle,
} from 'lucide-react'
import type { WorkerStatus } from '@/store/workerStore'

// ── Helpers ────────────────────────────────────────────────────────

function fmtCurrency(cents: number) {
  const abs = Math.abs(cents / 100)
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${abs.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function Stat({ icon: Icon, label, value, accent }: {
  icon: typeof DollarSign; label: string; value: string; accent?: string
}) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <Icon className={cn('w-3 h-3', accent || 'text-on-surface-muted/30')} strokeWidth={1.75} />
      <span className="text-[10px] text-on-surface-muted/40">{label}</span>
      <span className={cn('text-xs font-medium font-mono tabular-nums', accent || 'text-on-surface/70')}>{value}</span>
    </div>
  )
}

function Section({ label, icon: Icon, badge, defaultOpen = true, children }: {
  label: string; icon: any; badge?: number; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-1 py-1.5 text-[10px] uppercase tracking-wider text-on-surface-muted/30 hover:text-on-surface-muted/50 transition-colors">
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <Icon size={10} className="text-on-surface-muted/20" />
        {label}
        {badge != null && badge > 0 && (
          <span className="ml-auto rounded-full bg-gold/15 px-1.5 text-[9px] font-medium text-gold">{badge}</span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-1 space-y-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Stats Strip ────────────────────────────────────────────────────

function StatsStrip() {
  const { data: finance } = useQuery({
    queryKey: ['vitals-finance'],
    queryFn: getFinanceSummary,
    staleTime: 30_000,
  })
  const { data: actions } = useQuery({
    queryKey: ['vitals-actions'],
    queryFn: getActionStats,
    staleTime: 30_000,
  })

  const pending = actions?.pending ?? 0

  return (
    <div className="flex items-center gap-3 px-4 py-3 overflow-x-auto scrollbar-none border-b border-black/5">
      <Stat
        icon={DollarSign}
        label="Net"
        value={finance ? fmtCurrency(finance.net) : '--'}
        accent={finance && finance.net >= 0 ? 'text-green-400' : 'text-error/70'}
      />
      <Stat
        icon={AlertTriangle}
        label="Actions"
        value={String(pending)}
        accent={pending > 0 ? 'text-gold' : undefined}
      />
    </div>
  )
}

// ── System Health Section ──────────────────────────────────────────

function SystemHealthSection() {
  const { data: vitals } = useQuery({
    queryKey: ['vitals-system'],
    queryFn: getSystemVitals,
    staleTime: 30_000,
  })
  const workers = useWorkerStatus() as Record<string, WorkerStatus>

  const workerList = Object.values(workers)
  const totalWorkers = workerList.length
  const activeWorkers = workerList.filter(w => w.status === 'active').length
  const errorWorkers = workerList.filter(w => w.status === 'error')
  const fraction = totalWorkers > 0 ? (activeWorkers / totalWorkers) * 100 : 0

  const healthy = vitals?.healthy

  return (
    <div className="space-y-2 px-2">
      {/* EcodiaOS status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={cn(
            'h-1.5 w-1.5 rounded-full',
            healthy ? 'bg-green-400' : healthy === false ? 'bg-error' : 'bg-on-surface-muted/15',
          )} />
          <span className="text-[10px] text-on-surface-muted/50">EcodiaOS</span>
        </div>
        <span className={cn(
          'text-[10px] font-mono tabular-nums',
          healthy ? 'text-green-400/60' : 'text-on-surface-muted/25',
        )}>
          {healthy ? 'healthy' : healthy === false ? 'degraded' : 'unknown'}
        </span>
      </div>

      {/* Worker pressure bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-on-surface-muted/40">Workers</span>
          <span className="text-[10px] font-mono tabular-nums text-on-surface-muted/40">
            {activeWorkers}/{totalWorkers} active
          </span>
        </div>
        <div className="h-1 rounded-full bg-black/5 overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', fraction === 100 ? 'bg-green-400/30' : 'bg-primary/30')}
            initial={{ width: 0 }}
            animate={{ width: `${fraction}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          />
        </div>
      </div>

      {/* Error workers */}
      {errorWorkers.length > 0 && (
        <div className="space-y-0.5">
          {errorWorkers.map(w => (
            <div key={w.worker} className="flex items-center gap-1.5 px-1">
              <AlertTriangle className="w-3 h-3 text-gold" strokeWidth={1.75} />
              <span className="text-[10px] text-gold/70">{w.worker}</span>
              <span className="text-[9px] text-on-surface-muted/25 truncate flex-1">{w.error || 'error'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Momentum Section ───────────────────────────────────────────────

function MomentumSection() {
  const { data: momentum } = useQuery({
    queryKey: ['vitals-momentum'],
    queryFn: getMomentum,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  const summary = momentum?.summary
  if (!summary) {
    return <div className="px-2 py-3 text-[9px] text-on-surface-muted/20">Loading momentum...</div>
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-on-surface-muted/40">Sessions (7d)</span>
        <span className="text-xs font-mono tabular-nums text-on-surface/70">{summary.sessions7d}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-on-surface-muted/40">Success</span>
        <span className={cn(
          'text-xs font-mono tabular-nums',
          summary.successRate != null && summary.successRate >= 80 ? 'text-green-400/70' :
          summary.successRate != null && summary.successRate >= 50 ? 'text-on-surface/70' : 'text-gold/70',
        )}>
          {summary.successRate != null ? `${Math.round(summary.successRate)}%` : '--'}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-on-surface-muted/40">Files changed</span>
        <span className="text-xs font-mono tabular-nums text-on-surface/70">{summary.filesChanged}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-on-surface-muted/40">Deployed</span>
        <span className="text-xs font-mono tabular-nums text-on-surface/70">{summary.deployed}</span>
      </div>
    </div>
  )
}

// ── Actions Section ────────────────────────────────────────────────

function ActionsSection() {
  const { data: actions } = useQuery({
    queryKey: ['vitals-actions'],
    queryFn: getActionStats,
    staleTime: 30_000,
  })

  if (!actions) {
    return <div className="px-2 py-3 text-[9px] text-on-surface-muted/20">Loading actions...</div>
  }

  const pending = actions.pending ?? 0
  const urgent = actions.urgent ?? 0

  return (
    <div className="space-y-1.5 px-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-on-surface-muted/40">Pending</span>
        <span className={cn(
          'text-xs font-mono tabular-nums',
          pending > 0 ? 'text-gold' : 'text-on-surface/70',
        )}>
          {pending}
        </span>
      </div>
      {urgent > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-on-surface-muted/40">Urgent</span>
          <span className="text-xs font-mono tabular-nums text-error/70">{urgent}</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-on-surface-muted/40">Executed (24h)</span>
        <span className="text-xs font-mono tabular-nums text-on-surface/70">{actions.executed_24h ?? 0}</span>
      </div>
    </div>
  )
}

// ── Main Panel ─────────────────────────────────────────────────────

export default function VitalsPanel() {
  const { data: actions } = useQuery({
    queryKey: ['vitals-actions'],
    queryFn: getActionStats,
    staleTime: 30_000,
  })

  const pending = actions?.pending ?? 0

  return (
    <div className="h-full overflow-y-auto scrollbar-thin px-3 pt-3 pb-6 space-y-3">
      <StatsStrip />

      <Section label="System Health" icon={Cpu} defaultOpen>
        <SystemHealthSection />
      </Section>

      <Section label="Momentum" icon={Flame} defaultOpen>
        <MomentumSection />
      </Section>

      <Section label="Actions" icon={Activity} badge={pending} defaultOpen={pending > 0}>
        <ActionsSection />
      </Section>
    </div>
  )
}
