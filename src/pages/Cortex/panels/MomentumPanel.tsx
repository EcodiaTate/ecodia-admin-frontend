/**
 * MomentumPanel -- compact activity & momentum context panel embedded in Cortex.
 * Shows session stats, system health, cognitive streams, and recent sessions.
 * Absorbs the Momentum page into the Cortex workspace.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { getMomentum, type MomentumData } from '@/api/momentum'
import { cn } from '@/lib/utils'
import {
  Flame, GitCommit, FileCode, Rocket, CheckCircle2,
  Cpu, HardDrive, Heart, Clock,
  ChevronRight, ChevronDown,
} from 'lucide-react'

// -- Helpers ----------------------------------------------------------------

function Stat({ icon: Icon, label, value, accent }: { icon: typeof Flame; label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <Icon size={11} className="text-on-surface-muted/30" />
      <span className="text-[10px] text-on-surface-muted/40">{label}</span>
      <span className={cn('text-xs font-medium tabular-nums', accent || 'text-on-surface-muted/70')}>{value}</span>
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
          <span className="ml-auto rounded-full bg-primary/15 px-1.5 text-[9px] font-medium text-primary">{badge}</span>
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

function timeAgo(d: string) {
  const ms = Date.now() - new Date(d).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  if (mins < 1440) return `${Math.floor(mins / 60)}h`
  return `${Math.floor(mins / 1440)}d`
}

function formatMB(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(0)}MB`
}

function statusColor(status: string) {
  switch (status) {
    case 'complete': return 'bg-green-500'
    case 'running': return 'bg-amber-400'
    case 'error': return 'bg-red-400'
    default: return 'bg-on-surface-muted/25'
  }
}

function processStatusColor(status: string) {
  switch (status) {
    case 'online': return 'bg-green-500'
    case 'errored': return 'bg-red-400'
    default: return 'bg-on-surface-muted/25'
  }
}

function cpuBarColor(cpu: number) {
  if (cpu >= 80) return 'bg-red-400'
  if (cpu >= 60) return 'bg-amber-400'
  return 'bg-green-500'
}

// -- Stats Strip ------------------------------------------------------------

function StatsStrip({ data }: { data: MomentumData | undefined }) {
  if (!data) return null
  const { summary } = data

  return (
    <div className="flex items-center gap-4 px-1 py-2 overflow-x-auto scrollbar-none">
      <Stat icon={Flame} label="Sessions" value={String(summary.complete)} accent={summary.complete > 0 ? 'text-primary' : undefined} />
      <Stat icon={CheckCircle2} label="Success" value={summary.successRate != null ? `${summary.successRate}%` : '--'} accent={summary.successRate != null && summary.successRate >= 90 ? 'text-green-400' : undefined} />
      <Stat icon={Rocket} label="Deployed" value={String(summary.deployed)} accent={summary.deployed > 0 ? 'text-green-400' : undefined} />
    </div>
  )
}

// -- Activity Section -------------------------------------------------------

function ActivityGrid({ data }: { data: MomentumData }) {
  const { summary } = data
  const items = [
    { icon: FileCode, label: 'Files changed', value: summary.filesChanged },
    { icon: GitCommit, label: 'Commits (7d)', value: summary.commits7d },
    { icon: Rocket, label: 'Actions (7d)', value: summary.actionsExecuted7d },
    { icon: Flame, label: 'Total sessions', value: summary.sessions7d },
  ]

  return (
    <div className="grid grid-cols-2 gap-1.5">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.05] px-2.5 py-2">
          <Icon size={12} className="text-on-surface-muted/25 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-medium tabular-nums text-on-surface/70">{value}</div>
            <div className="text-[9px] text-on-surface-muted/30 truncate">{label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// -- System Health Section --------------------------------------------------

function HealthView({ data }: { data: MomentumData }) {
  const health = data.health
  if (!health) return <p className="text-[10px] text-on-surface-muted/25 px-1 py-2">Health data unavailable</p>

  const eos = health.ecodiaos
  const org = health.organism
  const cpu = eos.cpu ?? 0
  const mem = eos.memory
  const lag = eos.eventLoopLagMs

  return (
    <div className="space-y-2">
      {/* CPU */}
      <div className="px-1">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] text-on-surface-muted/40 flex items-center gap-1"><Cpu size={10} /> CPU</span>
          <span className="text-[10px] font-medium tabular-nums text-on-surface/70">{cpu.toFixed(0)}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div className={cn('h-full rounded-full transition-all', cpuBarColor(cpu))} style={{ width: `${Math.min(cpu, 100)}%` }} />
        </div>
      </div>

      {/* Memory */}
      {mem && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-on-surface-muted/40 flex items-center gap-1"><HardDrive size={10} /> Heap</span>
          <span className="text-[10px] font-medium tabular-nums text-on-surface/70">{formatMB(mem.heapUsed)} / {formatMB(mem.heapTotal)}</span>
        </div>
      )}

      {/* Event loop lag */}
      {lag != null && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-on-surface-muted/40 flex items-center gap-1"><Clock size={10} /> Loop lag</span>
          <span className={cn('text-[10px] font-medium tabular-nums', lag > 100 ? 'text-amber-400' : 'text-on-surface/70')}>{lag.toFixed(0)}ms</span>
        </div>
      )}

      {/* Organism status */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[10px] text-on-surface-muted/40 flex items-center gap-1"><Heart size={10} /> Organism</span>
        <span className={cn('text-[10px] font-medium', org.healthy ? 'text-green-400' : org.healthy === false ? 'text-red-400' : 'text-on-surface-muted/40')}>
          {org.healthy ? 'healthy' : org.healthy === false ? `unhealthy (${org.consecutiveFailures} fails)` : 'unknown'}
        </span>
      </div>

      {/* PM2 Processes */}
      {eos.pm2Processes.length > 0 && (
        <div className="space-y-0.5 px-1">
          <div className="text-[9px] font-mono uppercase tracking-widest text-on-surface-muted/25 mb-0.5">Processes</div>
          {eos.pm2Processes.map(p => (
            <div key={p.name} className="flex items-center gap-1.5 py-0.5">
              <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', processStatusColor(p.status))} />
              <span className="text-[10px] text-on-surface/60 flex-1 truncate">{p.name}</span>
              {p.restarts > 0 && (
                <span className="text-[9px] text-amber-400/60 tabular-nums">{p.restarts}r</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// -- Streams Section --------------------------------------------------------

function StreamsList({ data }: { data: MomentumData }) {
  const streams = data.streams
  if (streams.length === 0) return <p className="text-[10px] text-on-surface-muted/25 px-1 py-2">No streams</p>

  return (
    <div className="space-y-0.5">
      {streams.map(s => (
        <div key={s.stream} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/[0.04] transition-colors">
          <span className="text-[10px] text-on-surface/60 flex-1 truncate">{s.stream}</span>
          <span className="text-[10px] tabular-nums text-on-surface-muted/50">{s.complete}/{s.total}</span>
          {s.deployed > 0 && (
            <span className="rounded-full bg-green-500/10 px-1.5 text-[9px] font-medium text-green-400/70 tabular-nums">{s.deployed}d</span>
          )}
        </div>
      ))}
    </div>
  )
}

// -- Recent Sessions Section ------------------------------------------------

function RecentSessions({ data }: { data: MomentumData }) {
  const sessions = data.sessions.slice(0, 5)
  if (sessions.length === 0) return <p className="text-[10px] text-on-surface-muted/25 px-1 py-2">No recent sessions</p>

  return (
    <div className="space-y-0.5">
      {sessions.map(s => (
        <div key={s.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/[0.04] transition-colors">
          <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', statusColor(s.status))} />
          <span className="text-[10px] text-on-surface/60 flex-1 truncate">{s.prompt?.slice(0, 50) || 'untitled'}</span>
          {s.stream && <span className="text-[9px] text-primary/40 flex-shrink-0">{s.stream}</span>}
          <span className="text-[9px] text-on-surface-muted/30 flex-shrink-0 tabular-nums">{timeAgo(s.startedAt)}</span>
        </div>
      ))}
    </div>
  )
}

// -- Main Panel -------------------------------------------------------------

export default function MomentumPanel() {
  const { data } = useQuery({
    queryKey: ['momentum'],
    queryFn: getMomentum,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  return (
    <div className="h-full overflow-y-auto scrollbar-thin px-3 pt-3 pb-6 space-y-3">
      <StatsStrip data={data} />

      {data && (
        <>
          <Section label="Activity" icon={Flame} defaultOpen={true}>
            <ActivityGrid data={data} />
          </Section>

          <Section label="System Health" icon={Cpu} defaultOpen={true}>
            <HealthView data={data} />
          </Section>

          <Section label="Streams" icon={GitCommit} badge={data.streams.length} defaultOpen={false}>
            <StreamsList data={data} />
          </Section>

          <Section label="Recent Sessions" icon={Clock} badge={data.sessions.length} defaultOpen={true}>
            <RecentSessions data={data} />
          </Section>
        </>
      )}

      {!data && (
        <div className="flex items-center justify-center py-8">
          <Flame className="w-4 h-4 animate-pulse text-on-surface-muted/20" />
        </div>
      )}
    </div>
  )
}
