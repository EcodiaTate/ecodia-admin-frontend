/**
 * AdminPanel — compact system connections & services context panel embedded in Cortex.
 * Shows integration statuses, worker health, and system connections.
 * Absorbs the Settings connections tab into the Cortex workspace.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/api/client'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import type { WorkerStatus } from '@/store/workerStore'
import { cn } from '@/lib/utils'
import {
  Wifi, Mail, DollarSign, HardDrive, Cloud, Share2, Brain, Network,
  ChevronRight, ChevronDown, Activity, AlertTriangle,
} from 'lucide-react'

// ── Service definitions ────────────────────────────────────────────────

const SERVICES = [
  { key: 'xero', label: 'Xero', icon: DollarSign, category: 'Financial', worker: 'finance' },
  { key: 'gmail', label: 'Gmail', icon: Mail, category: 'Communication', worker: 'gmail' },
  { key: 'drive', label: 'Google Drive', icon: HardDrive, category: 'Storage', worker: 'google_drive' },
  { key: 'vercel', label: 'Vercel', icon: Cloud, category: 'Deployment', worker: 'vercel' },
  { key: 'meta', label: 'Meta', icon: Share2, category: 'Social', worker: 'meta' },
  { key: 'linkedin', label: 'LinkedIn', icon: Network, category: 'Influence', worker: 'linkedin' },
  { key: 'kg', label: 'Knowledge Graph', icon: Brain, category: 'World Model', worker: 'kg_consolidation' },
] as const

// ── Helpers ────────────────────────────────────────────────────────────

function Stat({ icon: Icon, label, value, accent }: { icon: typeof Wifi; label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <Icon className={cn('w-3 h-3', accent || 'text-on-surface-muted/30')} />
      <span className="text-[10px] text-on-surface-muted/40">{label}</span>
      <span className={cn('text-xs font-medium', accent || 'text-on-surface/70')}>{value}</span>
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

function timeAgo(d: string) {
  const ms = Date.now() - new Date(d).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  if (mins < 1440) return `${Math.floor(mins / 60)}h`
  return `${Math.floor(mins / 1440)}d`
}

function statusColor(status: WorkerStatus['status'] | undefined) {
  switch (status) {
    case 'active': return 'bg-green-400'
    case 'stale': return 'bg-gold'
    case 'error': return 'bg-error'
    default: return 'bg-on-surface-muted/20'
  }
}

// ── Stats Strip ────────────────────────────────────────────────────────

function StatsStrip({ workers, settings }: { workers: Record<string, WorkerStatus>; settings: any }) {
  const workerEntries = Object.values(workers)
  const activeCount = workerEntries.filter(w => w.status === 'active').length
  const errorCount = workerEntries.filter(w => w.status === 'error').length

  const connectedCount = SERVICES.filter(s => {
    const w = workers[s.worker]
    const settingConnected = settings?.[s.key]?.connected
    return settingConnected || w?.status === 'active'
  }).length

  return (
    <div className="flex items-center gap-4 px-1 py-2 overflow-x-auto scrollbar-none">
      <Stat icon={Wifi} label="Connected" value={`${connectedCount}/${SERVICES.length}`}
        accent={connectedCount === SERVICES.length ? 'text-green-400' : undefined} />
      <Stat icon={Activity} label="Workers" value={String(activeCount)}
        accent={activeCount > 0 ? 'text-green-400' : undefined} />
      {errorCount > 0 && (
        <Stat icon={AlertTriangle} label="Errors" value={String(errorCount)} accent="text-gold" />
      )}
    </div>
  )
}

// ── Service Row ────────────────────────────────────────────────────────

function ServiceRow({ service, worker, connected }: {
  service: typeof SERVICES[number]; worker: WorkerStatus | undefined; connected: boolean
}) {
  const Icon = service.icon
  const hasWorker = !!worker
  const effectiveStatus = hasWorker ? worker.status : undefined
  const isConnected = connected || effectiveStatus === 'active'

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors">
      <Icon className="w-3.5 h-3.5 text-on-surface-muted/40 flex-shrink-0" />
      <span className="text-[11px] text-on-surface/60 flex-1 truncate">{service.label}</span>
      <span className="text-[9px] text-on-surface-muted/25 flex-shrink-0">{service.category}</span>
      {/* Connection dot */}
      <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', isConnected ? statusColor(effectiveStatus) : 'bg-on-surface-muted/20')} />
      {/* Worker pulse */}
      {hasWorker && (
        <div className="relative flex-shrink-0">
          <div className={cn('w-1.5 h-1.5 rounded-full', statusColor(effectiveStatus))} />
          {effectiveStatus === 'active' && (
            <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-green-400 animate-ping opacity-40" />
          )}
        </div>
      )}
      {/* Last sync */}
      {worker?.lastSync && (
        <span className="text-[9px] text-on-surface-muted/25 tabular-nums flex-shrink-0 w-6 text-right">
          {timeAgo(worker.lastSync)}
        </span>
      )}
    </div>
  )
}

// ── Services List ──────────────────────────────────────────────────────

function ServicesList({ workers, settings }: { workers: Record<string, WorkerStatus>; settings: any }) {
  return (
    <div className="space-y-px">
      {SERVICES.map(s => (
        <ServiceRow
          key={s.key}
          service={s}
          worker={workers[s.worker]}
          connected={!!settings?.[s.key]?.connected}
        />
      ))}
    </div>
  )
}

// ── Workers List ───────────────────────────────────────────────────────

function WorkersList({ workers }: { workers: Record<string, WorkerStatus> }) {
  const entries = Object.values(workers).sort((a, b) => a.worker.localeCompare(b.worker))

  if (entries.length === 0) {
    return <p className="text-xs text-on-surface-muted/25 px-2 py-2">No worker data</p>
  }

  return (
    <div className="space-y-px">
      {entries.map(w => (
        <div key={w.worker} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors">
          <div className="relative flex-shrink-0">
            <div className={cn('w-1.5 h-1.5 rounded-full', statusColor(w.status))} />
            {w.status === 'active' && (
              <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-green-400 animate-ping opacity-40" />
            )}
          </div>
          <span className="text-[11px] text-on-surface/60 flex-1 truncate font-mono">{w.worker}</span>
          <span className={cn('text-[9px] flex-shrink-0',
            w.status === 'active' ? 'text-green-400/60' : w.status === 'stale' ? 'text-gold/60' : 'text-error/60',
          )}>{w.status}</span>
          {w.lastSync && (
            <span className="text-[9px] text-on-surface-muted/25 tabular-nums flex-shrink-0">
              {timeAgo(w.lastSync)}
            </span>
          )}
          {w.error && (
            <span className="text-[9px] text-error/50 truncate max-w-[80px] flex-shrink-0" title={w.error}>
              {w.error}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main Panel ─────────────────────────────────────────────────────────

export default function AdminPanel() {
  const workers = useWorkerStatus() as Record<string, WorkerStatus>

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/settings')).data,
    staleTime: 30_000,
  })

  return (
    <div className="h-full overflow-y-auto scrollbar-thin px-3 pt-3 pb-6 space-y-3">
      <StatsStrip workers={workers} settings={settings} />
      <Section label="Services" icon={Wifi} defaultOpen={true}>
        <ServicesList workers={workers} settings={settings} />
      </Section>
      <Section label="Workers" icon={Activity}
        badge={Object.values(workers).filter(w => w.status === 'error').length}
        defaultOpen={false}>
        <WorkersList workers={workers} />
      </Section>
    </div>
  )
}
