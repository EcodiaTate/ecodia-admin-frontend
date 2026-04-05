/**
 * CRMPanel — Client intelligence panel embedded in Cortex CRM workspace.
 * Shows pipeline overview, recent activity, open tasks, and quick client search.
 * Click a client to expand their full intelligence view inline.
 */
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import api from '@/api/client'
import {
  Users, Inbox, CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft, ChevronDown,
  Search, Clock, Activity, DollarSign, Mail, Code2, FileText, Check, Circle,
} from 'lucide-react'

// ── API helpers ──────────────────────────────────────────────────────

async function getCRMDashboard() { return (await api.get('/crm/dashboard')).data }
async function getClientIntelligence(id: string) { return (await api.get(`/crm/clients/${id}/intelligence`)).data }
async function getClientTimeline(id: string) { return (await api.get(`/crm/clients/${id}/timeline?limit=20`)).data }
async function searchClients(q: string) { return (await api.get('/crm/search', { params: { q } })).data }
async function completeTask(id: string) { return (await api.post(`/crm/tasks/${id}/complete`)).data }

// ── Stats Strip ──────────────────────────────────────────────────────

function Stat({ icon: Icon, label, value, accent }: { icon: typeof Users; label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <Icon className={cn('w-3 h-3', accent || 'text-on-surface-muted/30')} />
      <span className="text-[10px] text-on-surface-muted/40">{label}</span>
      <span className={cn('text-xs font-medium', accent || 'text-on-surface/70')}>{value}</span>
    </div>
  )
}

function StatsStrip() {
  const { data } = useQuery({ queryKey: ['crm-dashboard'], queryFn: getCRMDashboard, staleTime: 15_000 })

  const totalClients = data?.pipeline?.pipeline?.reduce((s: number, p: any) => s + (p.count || 0), 0) ?? 0
  const openTasks = data?.taskStats?.open ?? 0
  const overdueTasks = data?.taskStats?.overdue ?? 0
  const pipelineValue = data?.revenue?.totals?.total_pipeline ?? 0

  return (
    <div className="flex items-center gap-4 px-1 py-2 overflow-x-auto scrollbar-none">
      <Stat icon={Users} label="Clients" value={String(totalClients)} />
      <Stat icon={Inbox} label="Tasks" value={String(openTasks)} accent={openTasks > 0 ? 'text-amber-500' : undefined} />
      <Stat icon={AlertTriangle} label="Overdue" value={String(overdueTasks)} accent={overdueTasks > 0 ? 'text-red-400' : undefined} />
      {pipelineValue > 0 && <Stat icon={DollarSign} label="Pipeline" value={`$${(pipelineValue / 1000).toFixed(0)}k`} accent="text-green-500" />}
    </div>
  )
}

// ── Pipeline Mini ────────────────────────────────────────────────────

function PipelineMini({ onSelectClient }: { onSelectClient: (id: string) => void }) {
  const { data } = useQuery({ queryKey: ['crm-dashboard'], queryFn: getCRMDashboard, staleTime: 15_000 })
  const stages = data?.pipeline?.pipeline || []
  const recentMoves = data?.pipeline?.recentMoves || []

  return (
    <div>
      {/* Stage bars */}
      <div className="flex gap-1 mb-2">
        {stages.filter((s: any) => s.stage !== 'archived').map((s: any) => (
          <div key={s.stage} className="flex-1 text-center">
            <div className="text-[9px] text-on-surface-muted/30 uppercase tracking-wider mb-0.5">{s.stage}</div>
            <div className="text-sm font-light text-on-surface/70">{s.count}</div>
            {s.total_value > 0 && (
              <div className="text-[9px] text-green-500/60">${(s.total_value / 1000).toFixed(0)}k</div>
            )}
          </div>
        ))}
      </div>

      {/* Recent moves */}
      {recentMoves.length > 0 && (
        <div className="space-y-0.5 mt-2">
          <div className="text-[9px] font-mono uppercase tracking-widest text-on-surface-muted/25 mb-1">Recent moves</div>
          {recentMoves.slice(0, 4).map((m: any, i: number) => (
            <button key={i} onClick={() => onSelectClient(m.client_id)}
              className="w-full text-left flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/[0.04] transition-colors text-[10px]">
              <span className="text-on-surface/60 truncate flex-1">{m.client_name}</span>
              <span className="text-on-surface-muted/30">{m.from_stage}</span>
              <ChevronRight className="w-2.5 h-2.5 text-on-surface-muted/20" />
              <span className="text-primary/50">{m.to_stage}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Activity Feed ────────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<string, typeof Activity> = {
  email_received: Mail, email_sent: Mail, note_added: FileText,
  stage_changed: Activity, task_created: Inbox, task_completed: CheckCircle2,
  session_dispatched: Code2, session_completed: Code2,
  lead_created: Users, deal_updated: DollarSign, payment_received: DollarSign,
}

function ActivityFeed({ activities, onSelectClient }: { activities: any[]; onSelectClient: (id: string) => void }) {
  return (
    <div className="space-y-0.5">
      {activities.map((a: any, i: number) => {
        const Icon = ACTIVITY_ICONS[a.activity_type] || Circle
        return (
          <button key={a.id || i} onClick={() => onSelectClient(a.client_id)}
            className="w-full text-left flex items-center gap-2 px-2 py-1 rounded hover:bg-white/[0.04] transition-colors">
            <Icon className="w-3 h-3 text-on-surface-muted/30 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-on-surface/60 truncate">{a.title}</p>
              <p className="text-[9px] text-on-surface-muted/30">{a.client_name} · {timeAgo(a.created_at)}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function timeAgo(date: string) {
  const ms = Date.now() - new Date(date).getTime()
  if (ms < 60000) return 'now'
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`
  return `${Math.round(ms / 86400000)}d`
}

// ── Client Intelligence View ─────────────────────────────────────────

function ClientIntelView({ clientId, onBack }: { clientId: string; onBack: () => void }) {
  const queryClient = useQueryClient()
  const { data: intel, isLoading } = useQuery({
    queryKey: ['crm-intel', clientId],
    queryFn: () => getClientIntelligence(clientId),
    staleTime: 10_000,
  })

  const { data: timeline } = useQuery({
    queryKey: ['crm-timeline', clientId],
    queryFn: () => getClientTimeline(clientId),
    staleTime: 15_000,
  })

  const completeMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-intel', clientId] })
      queryClient.invalidateQueries({ queryKey: ['crm-dashboard'] })
    },
  })

  if (isLoading || !intel) {
    return <div className="flex items-center justify-center h-32"><Clock className="w-4 h-4 animate-pulse text-on-surface-muted/20" /></div>
  }

  const c = intel.client

  return (
    <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4 overflow-y-auto scrollbar-thin pr-1">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="p-1 rounded hover:bg-white/10 text-on-surface-muted/40"><ChevronLeft className="w-4 h-4" /></button>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-on-surface/80 truncate">{c.name}</h3>
          <div className="flex items-center gap-2 text-[10px] text-on-surface-muted/40">
            {c.company && <span>{c.company}</span>}
            <span className="px-1.5 py-0.5 rounded bg-primary/5 text-primary/50">{c.stage}</span>
            {c.health_score != null && (
              <span className={c.health_score >= 0.6 ? 'text-green-500/60' : c.health_score >= 0.4 ? 'text-amber-500/60' : 'text-red-400/60'}>
                {(c.health_score * 100).toFixed(0)}% health
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: 'Emails', value: intel.summary.emailCount },
          { label: 'Tasks', value: intel.summary.openTasks },
          { label: 'Sessions', value: intel.summary.totalSessions },
          { label: 'Projects', value: intel.summary.projectCount },
        ].map(s => (
          <div key={s.label} className="px-2 py-1.5 rounded bg-white/[0.03] border border-white/[0.05]">
            <div className="text-xs font-light text-on-surface/70">{s.value}</div>
            <div className="text-[9px] text-on-surface-muted/30 uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue */}
      {intel.revenue && (intel.revenue.total_deal_value > 0 || intel.revenue.total_paid > 0) && (
        <div className="flex items-center gap-3 text-[10px]">
          <DollarSign className="w-3 h-3 text-green-500/50" />
          <span className="text-on-surface-muted/40">Pipeline: ${intel.revenue.total_deal_value}</span>
          {intel.revenue.total_paid > 0 && <span className="text-green-500/60">Paid: ${intel.revenue.total_paid}</span>}
          {intel.revenue.total_invoiced > 0 && <span className="text-amber-500/60">Invoiced: ${intel.revenue.total_invoiced}</span>}
        </div>
      )}

      {/* Open tasks */}
      {intel.openTasks.length > 0 && (
        <div>
          <div className="text-[9px] font-mono uppercase tracking-widest text-on-surface-muted/25 mb-1">Open Tasks</div>
          <div className="space-y-0.5">
            {intel.openTasks.map((t: any) => (
              <div key={t.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white/[0.04]">
                <button onClick={() => completeMutation.mutate(t.id)} className="p-0.5 rounded hover:bg-green-500/10 text-on-surface-muted/30 hover:text-green-400">
                  <Check className="w-3 h-3" />
                </button>
                <span className="text-[10px] text-on-surface/60 flex-1 truncate">{t.title}</span>
                <span className={cn('text-[9px] px-1 py-0.5 rounded', t.priority === 'urgent' ? 'bg-red-500/10 text-red-400' : t.priority === 'high' ? 'bg-amber-500/10 text-amber-400' : 'text-on-surface-muted/30')}>
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active sessions */}
      {intel.activeSessions.length > 0 && (
        <div>
          <div className="text-[9px] font-mono uppercase tracking-widest text-on-surface-muted/25 mb-1">Active Sessions</div>
          {intel.activeSessions.map((s: any) => (
            <div key={s.id} className="flex items-center gap-2 px-2 py-1 text-[10px]">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
              <span className="text-on-surface/60 truncate flex-1">{s.initial_prompt?.slice(0, 60)}</span>
              {s.codebase_name && <span className="text-primary/40">{s.codebase_name}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Recent emails */}
      {intel.recentEmails.length > 0 && (
        <div>
          <div className="text-[9px] font-mono uppercase tracking-widest text-on-surface-muted/25 mb-1">Recent Emails</div>
          {intel.recentEmails.map((e: any) => (
            <div key={e.id} className="flex items-center gap-2 px-2 py-1 text-[10px]">
              <Mail className="w-3 h-3 text-on-surface-muted/25 flex-shrink-0" />
              <span className="text-on-surface/60 truncate flex-1">{e.subject}</span>
              <span className="text-on-surface-muted/30">{timeAgo(e.received_at)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Activity timeline */}
      {timeline?.activities?.length > 0 && (
        <div>
          <div className="text-[9px] font-mono uppercase tracking-widest text-on-surface-muted/25 mb-1">Activity</div>
          <div className="space-y-0.5">
            {timeline.activities.slice(0, 10).map((a: any) => {
              const Icon = ACTIVITY_ICONS[a.activity_type] || Circle
              return (
                <div key={a.id} className="flex items-center gap-2 px-2 py-0.5 text-[10px]">
                  <Icon className="w-2.5 h-2.5 text-on-surface-muted/25 flex-shrink-0" />
                  <span className="text-on-surface/50 truncate flex-1">{a.title}</span>
                  <span className="text-on-surface-muted/25">{timeAgo(a.created_at)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Projects */}
      {intel.projects.length > 0 && (
        <div>
          <div className="text-[9px] font-mono uppercase tracking-widest text-on-surface-muted/25 mb-1">Projects</div>
          {intel.projects.map((p: any) => (
            <div key={p.id} className="px-2 py-1.5 rounded bg-white/[0.02] border border-white/[0.04] mb-1">
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-on-surface/60 font-medium">{p.name}</span>
                <span className="px-1 py-0.5 rounded bg-white/10 text-on-surface-muted/40">{p.status}</span>
                {p.deal_value_aud && <span className="text-green-500/50">${p.deal_value_aud}</span>}
              </div>
              {p.tech_stack?.length > 0 && (
                <div className="text-[9px] text-on-surface-muted/30 mt-0.5">{p.tech_stack.join(', ')}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── Search ───────────────────────────────────────────────────────────

function QuickSearch({ onSelect }: { onSelect: (id: string) => void }) {
  const [q, setQ] = useState('')
  const { data } = useQuery({
    queryKey: ['crm-search', q],
    queryFn: () => searchClients(q),
    enabled: q.length >= 2,
    staleTime: 5_000,
  })

  return (
    <div className="relative">
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
        <Search className="w-3 h-3 text-on-surface-muted/30" />
        <input
          value={q} onChange={e => setQ(e.target.value)} placeholder="Search clients..."
          className="flex-1 text-xs bg-transparent text-on-surface placeholder:text-on-surface-muted/25 outline-none"
        />
      </div>
      <AnimatePresence>
        {q.length >= 2 && data?.results?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="absolute left-0 right-0 top-full mt-1 rounded-lg bg-surface-container border border-white/10 shadow-xl z-10 max-h-48 overflow-auto">
            {data.results.map((c: any) => (
              <button key={c.id} onClick={() => { onSelect(c.id); setQ('') }}
                className="w-full text-left px-3 py-2 hover:bg-white/[0.06] flex items-center gap-2 text-xs">
                <span className="text-on-surface/70 flex-1">{c.name}</span>
                {c.company && <span className="text-on-surface-muted/30">{c.company}</span>}
                <span className="px-1 py-0.5 rounded bg-primary/5 text-primary/40 text-[9px]">{c.stage}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main CRM Panel ───────────────────────────────────────────────────

export default function CRMPanel() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  if (selectedClientId) {
    return <ClientIntelView clientId={selectedClientId} onBack={() => setSelectedClientId(null)} />
  }

  return (
    <div className="space-y-4 overflow-y-auto scrollbar-thin pr-1">
      <StatsStrip />
      <QuickSearch onSelect={setSelectedClientId} />
      <Section title="Pipeline">
        <PipelineMini onSelectClient={setSelectedClientId} />
      </Section>
      <Section title="Recent Activity">
        <RecentActivitySection onSelectClient={setSelectedClientId} />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 mb-1 text-[9px] font-mono uppercase tracking-widest text-on-surface-muted/30 hover:text-on-surface-muted/50">
        {open ? <ChevronDown className="w-2.5 h-2.5" /> : <ChevronRight className="w-2.5 h-2.5" />}
        {title}
      </button>
      <AnimatePresence>
        {open && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>{children}</motion.div>}
      </AnimatePresence>
    </div>
  )
}

function RecentActivitySection({ onSelectClient }: { onSelectClient: (id: string) => void }) {
  const { data } = useQuery({ queryKey: ['crm-dashboard'], queryFn: getCRMDashboard, staleTime: 15_000 })
  const activities = data?.recentActivity || []
  if (activities.length === 0) return <p className="text-xs text-on-surface-muted/25 py-2">No recent activity</p>
  return <ActivityFeed activities={activities} onSelectClient={onSelectClient} />
}
