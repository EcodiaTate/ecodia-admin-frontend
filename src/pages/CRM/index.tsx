import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClient, getPipeline, getClientIntelligence, getClientTimeline, completeTask, updateClientStatus } from '@/api/crm'
import { ProjectDetail } from './ProjectDetail'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Client, PipelineStage, CRMActivity } from '@/types/crm'
import { motion, AnimatePresence } from 'framer-motion'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import {
  ArrowLeft, Search, Mail, CheckCircle2, Code2, FileText, Activity,
  DollarSign, Users, Circle, Check,
  Heart, Inbox,
} from 'lucide-react'
import { formatRelative, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

// ─── Stage config ────────────────────────────────────────────────────

const STAGES: PipelineStage[] = ['lead', 'proposal', 'contract', 'development', 'live', 'ongoing']

const STAGE_MOMENTUM: Record<PipelineStage, number> = {
  lead: 0.2, proposal: 0.4, contract: 0.6, development: 0.8, live: 1.0, ongoing: 0.9, archived: 0.0,
}

const STAGE_COLOR: Record<PipelineStage, string> = {
  lead: 'text-on-surface-muted/50', proposal: 'text-tertiary/60', contract: 'text-gold/70',
  development: 'text-primary/80', live: 'text-secondary', ongoing: 'text-secondary/70', archived: 'text-on-surface-muted/20',
}

// ─── Activity icons ──────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<string, typeof Activity> = {
  email_received: Mail, email_sent: Mail, note_added: FileText,
  stage_changed: Activity, task_created: Inbox, task_completed: CheckCircle2,
  session_dispatched: Code2, session_completed: Code2, lead_created: Users,
  deal_updated: DollarSign, payment_received: DollarSign,
}

// ─── Health indicator ────────────────────────────────────────────────

function HealthDot({ score }: { score: number | null }) {
  if (score == null) return null
  const color = score >= 0.6 ? 'bg-green-500' : score >= 0.4 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className={`w-1.5 h-1.5 rounded-full ${color} flex-shrink-0`} title={`Health: ${(score * 100).toFixed(0)}%`} />
  )
}

// ─── Main CRM Page ───────────────────────────────────────────────────

export default function CRMPage() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const activeId = clientId || selectedClientId

  const { data: client } = useQuery({
    queryKey: ['client', activeId],
    queryFn: () => getClient(activeId!),
    enabled: !!activeId,
  })

  const { data: pipeline } = useQuery({
    queryKey: ['pipeline'],
    queryFn: getPipeline,
    refetchInterval: 30000,
  })

  const allClients = useMemo(() => {
    if (!pipeline) return []
    return (Object.entries(pipeline) as [PipelineStage, Client[]][])
      .filter(([stage]) => stage !== 'archived')
      .flatMap(([, clients]) => clients)
      .sort((a, b) => (STAGE_MOMENTUM[b.status] ?? 0) - (STAGE_MOMENTUM[a.status] ?? 0))
  }, [pipeline])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allClients
    const q = searchQuery.toLowerCase()
    return allClients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.company?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  }, [allClients, searchQuery])

  const selectClient = (c: Client) => {
    setSelectedClientId(c.id)
    navigate(`/crm/${c.id}`, { replace: true })
  }

  const goBack = () => {
    setSelectedClientId(null)
    navigate('/crm', { replace: true })
  }

  const liveCount = allClients.filter(c => c.status === 'live' || c.status === 'ongoing').length
  const inMotionCount = allClients.filter(c => ['development', 'contract', 'proposal'].includes(c.status)).length
  const totalRevenue = allClients.reduce((s, c) => s + ((c as any).pipeline_value || 0), 0)

  return (
    <div className="mx-auto max-w-5xl">
      <SpatialLayer z={25} className="mb-10">
        <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted/60">
          Relational Field
        </span>
        <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
          Flow <em className="not-italic font-normal text-primary">State</em>
        </h1>

        {allClients.length > 0 && (
          <div className="mt-6 flex items-center gap-8 text-on-surface-muted/40">
            <span className="font-mono text-label-sm">
              <span className="text-secondary">{liveCount}</span> live
            </span>
            <span className="font-mono text-label-sm">
              <span className="text-tertiary">{inMotionCount}</span> in motion
            </span>
            <span className="font-mono text-label-sm">
              <span className="text-on-surface-variant">{allClients.length}</span> total
            </span>
            {totalRevenue > 0 && (
              <span className="font-mono text-label-sm">
                <span className="text-green-500">{formatCurrency(totalRevenue)}</span> pipeline
              </span>
            )}
          </div>
        )}
      </SpatialLayer>

      <SpatialLayer z={-5}>
        <AnimatePresence mode="popLayout" initial={false}>
          {client ? (
            <motion.div
              key="client-detail"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 100, damping: 22 }}
              className="max-w-4xl space-y-6"
            >
              <button onClick={goBack}
                className="flex items-center gap-2 text-sm text-on-surface-muted transition-colors hover:text-on-surface-variant">
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} /> Back
              </button>

              <ClientDetail client={client} />
              <ClientIntelligence clientId={client.id} />
              <ProjectDetail clientId={client.id} />
            </motion.div>
          ) : (
            <motion.div key="field" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Search */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-muted/30" />
                  <input
                    value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search clients..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/40 border border-black/5 text-sm text-on-surface placeholder:text-on-surface-muted/30 outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <RelationalField clients={filtered} onSelect={selectClient} />
            </motion.div>
          )}
        </AnimatePresence>
      </SpatialLayer>
    </div>
  )
}

// ─── Relational Field ────────────────────────────────────────────────

function RelationalField({ clients, onSelect }: { clients: Client[]; onSelect: (c: Client) => void }) {
  if (clients.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-on-surface-muted/30">The field is quiet.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {clients.map((client, i) => {
        const momentum = STAGE_MOMENTUM[client.status] ?? 0
        const opacity = 0.3 + momentum * 0.7
        const c = client as any

        return (
          <motion.button
            key={client.id}
            onClick={() => onSelect(client)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity, y: 0 }}
            whileHover={{ opacity: 1, y: -2, transition: { type: 'spring', stiffness: 200, damping: 20 } }}
            transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.02 }}
            className="group rounded-2xl bg-white/40 p-5 text-left hover:bg-white/60"
            style={{ opacity }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <HealthDot score={client.health_score} />
                  <p className="font-display text-sm font-medium text-on-surface truncate">{client.name}</p>
                </div>
                {client.company && (
                  <p className="mt-0.5 text-xs text-on-surface-muted truncate">{client.company}</p>
                )}
              </div>
              <span className={`shrink-0 font-mono text-[10px] uppercase tracking-wider ${STAGE_COLOR[client.status]}`}>
                {client.status}
              </span>
            </div>

            {/* Quick stats */}
            <div className="mt-2.5 flex items-center gap-3 text-[10px] font-mono text-on-surface-muted/30">
              {c.open_tasks > 0 && <span className="text-amber-500/60">{c.open_tasks} tasks</span>}
              {c.active_projects > 0 && <span>{c.active_projects} projects</span>}
              {c.pipeline_value > 0 && <span className="text-green-500/60">{formatCurrency(c.pipeline_value)}</span>}
            </div>

            {client.tags?.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {client.tags.map(tag => (
                  <span key={tag} className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-muted/50">{tag}</span>
                ))}
              </div>
            )}

            <p className="mt-2.5 font-mono text-[10px] text-on-surface-muted/25 opacity-0 transition-opacity group-hover:opacity-100">
              {formatRelative(client.updated_at)}
            </p>
          </motion.button>
        )
      })}
    </div>
  )
}

// ─── Client Detail Header ────────────────────────────────────────────

function ClientDetail({ client }: { client: Client }) {
  const momentum = STAGE_MOMENTUM[client.status] ?? 0
  const queryClient = useQueryClient()

  const stageMutation = useMutation({
    mutationFn: async ({ stage, note }: { stage: string; note?: string }) => {
      await updateClientStatus(client.id, stage, note)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', client.id] })
      queryClient.invalidateQueries({ queryKey: ['pipeline'] })
      toast.success('Stage updated')
    },
  })

  return (
    <GlassPanel depth="elevated" className="p-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <HealthDot score={client.health_score} />
            <h1 className="font-display text-display-md font-light text-on-surface">{client.name}</h1>
          </div>
          {client.company && <p className="mt-1.5 text-sm text-on-surface-muted">{client.company}</p>}
          {client.source && <p className="mt-0.5 text-[10px] font-mono text-on-surface-muted/30">via {client.source}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          {/* Stage selector */}
          <select
            value={client.status}
            onChange={e => stageMutation.mutate({ stage: e.target.value })}
            disabled={stageMutation.isPending}
            className={`font-mono text-sm uppercase tracking-wider bg-transparent border-none outline-none cursor-pointer ${STAGE_COLOR[client.status]} disabled:opacity-50`}
          >
            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            <option value="archived">archived</option>
          </select>
          <StatusBadge status={client.priority} />
        </div>
      </div>

      {/* Momentum bar */}
      <div className="mt-5 h-px w-full bg-on-surface-muted/8">
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${momentum * 100}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 20, delay: 0.2 }}
          className="h-px bg-secondary/40"
        />
      </div>

      {/* Contact info + stats */}
      <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {client.email && (
          <div>
            <span className="text-label-sm uppercase tracking-[0.05em] text-on-surface-muted/50">Email</span>
            <p className="mt-0.5 text-on-surface-variant">{client.email}</p>
          </div>
        )}
        {client.phone && (
          <div>
            <span className="text-label-sm uppercase tracking-[0.05em] text-on-surface-muted/50">Phone</span>
            <p className="mt-0.5 text-on-surface-variant">{client.phone}</p>
          </div>
        )}
        {client.linkedin_url && (
          <div>
            <span className="text-label-sm uppercase tracking-[0.05em] text-on-surface-muted/50">LinkedIn</span>
            <a href={client.linkedin_url} target="_blank" rel="noopener noreferrer"
              className="mt-0.5 block truncate text-sm text-primary/70 hover:text-primary">{client.linkedin_url}</a>
          </div>
        )}
        {client.total_revenue_aud != null && client.total_revenue_aud > 0 && (
          <div>
            <span className="text-label-sm uppercase tracking-[0.05em] text-on-surface-muted/50">Revenue</span>
            <p className="mt-0.5 text-green-600 font-medium">{formatCurrency(client.total_revenue_aud)}</p>
          </div>
        )}
      </div>

      {/* Quick stats row */}
      <div className="mt-5 flex items-center gap-6 text-[11px] font-mono text-on-surface-muted/40">
        {client.email_count != null && <span><Mail className="w-3 h-3 inline mr-1" />{client.email_count} emails</span>}
        {client.open_tasks != null && <span><Inbox className="w-3 h-3 inline mr-1" />{client.open_tasks} tasks</span>}
        {client.total_sessions != null && <span><Code2 className="w-3 h-3 inline mr-1" />{client.total_sessions} sessions</span>}
        {client.active_projects != null && <span>{client.active_projects} projects</span>}
        {client.health_score != null && (
          <span className={client.health_score >= 0.6 ? 'text-green-500' : client.health_score >= 0.4 ? 'text-amber-500' : 'text-red-400'}>
            <Heart className="w-3 h-3 inline mr-1" />{(client.health_score * 100).toFixed(0)}%
          </span>
        )}
      </div>
    </GlassPanel>
  )
}

// ─── Client Intelligence: timeline, tasks, emails, sessions ──────────

function ClientIntelligence({ clientId }: { clientId: string }) {
  const queryClient = useQueryClient()

  const { data: intel } = useQuery({
    queryKey: ['clientIntelligence', clientId],
    queryFn: () => getClientIntelligence(clientId),
    staleTime: 15000,
  })

  const { data: timeline } = useQuery({
    queryKey: ['clientTimeline', clientId],
    queryFn: () => getClientTimeline(clientId, { limit: 30 }),
    staleTime: 15000,
  })

  const completeMutation = useMutation({
    mutationFn: completeTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientIntelligence', clientId] })
      toast.success('Task completed')
    },
  })

  if (!intel) return null

  const activities: CRMActivity[] = timeline?.activities || []

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Open Tasks */}
      {intel.openTasks?.length > 0 && (
        <GlassPanel depth="surface" className="p-5">
          <h3 className="text-label-sm uppercase tracking-[0.1em] text-on-surface-muted/40 mb-3 flex items-center gap-1.5">
            <Inbox className="w-3.5 h-3.5" /> Tasks ({intel.openTasks.length})
          </h3>
          <div className="space-y-1">
            {intel.openTasks.map((t: any) => (
              <div key={t.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/30 transition-colors">
                <button onClick={() => completeMutation.mutate(t.id)}
                  className="p-0.5 rounded hover:bg-green-500/10 text-on-surface-muted/30 hover:text-green-600 transition-colors flex-shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-on-surface/70 flex-1 truncate">{t.title}</span>
                <StatusBadge status={t.priority} className="!text-[9px] !px-1.5 !py-0.5" />
                {t.due_date && (
                  <span className={`text-[10px] font-mono ${new Date(t.due_date) < new Date() ? 'text-red-400' : 'text-on-surface-muted/30'}`}>
                    {new Date(t.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Recent Emails */}
      {intel.recentEmails?.length > 0 && (
        <GlassPanel depth="surface" className="p-5">
          <h3 className="text-label-sm uppercase tracking-[0.1em] text-on-surface-muted/40 mb-3 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5" /> Emails ({intel.summary?.emailCount || intel.recentEmails.length})
          </h3>
          <div className="space-y-1">
            {intel.recentEmails.map((e: any) => (
              <div key={e.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${e.status === 'unread' ? 'bg-primary' : 'bg-on-surface-muted/20'}`} />
                <span className="text-xs text-on-surface/70 flex-1 truncate">{e.subject}</span>
                {e.triage_priority && <StatusBadge status={e.triage_priority} className="!text-[9px] !px-1.5 !py-0.5" />}
                <span className="text-[10px] text-on-surface-muted/30">{formatRelative(e.received_at)}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Active Sessions */}
      {intel.activeSessions?.length > 0 && (
        <GlassPanel depth="surface" className="p-5">
          <h3 className="text-label-sm uppercase tracking-[0.1em] text-on-surface-muted/40 mb-3 flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5" /> Active Sessions
          </h3>
          <div className="space-y-1">
            {intel.activeSessions.map((s: any) => (
              <div key={s.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                <span className="text-xs text-on-surface/70 flex-1 truncate">{s.initial_prompt?.slice(0, 60)}</span>
                {s.codebase_name && <span className="text-[10px] text-primary/50">{s.codebase_name}</span>}
                <StatusBadge status={s.status} className="!text-[9px] !px-1.5 !py-0.5" />
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Contacts */}
      {intel.contacts?.length > 0 && (
        <GlassPanel depth="surface" className="p-5">
          <h3 className="text-label-sm uppercase tracking-[0.1em] text-on-surface-muted/40 mb-3 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Contacts ({intel.contacts.length})
          </h3>
          <div className="space-y-1">
            {intel.contacts.map((c: any) => (
              <div key={c.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg">
                {c.is_primary && <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                {!c.is_primary && <div className="w-1.5 h-1.5 rounded-full bg-on-surface-muted/20 flex-shrink-0" />}
                <span className="text-xs text-on-surface/70 flex-1">{c.name}</span>
                {c.role && <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-muted/50">{c.role}</span>}
                {c.email && <span className="text-[10px] text-on-surface-muted/30 truncate max-w-[120px]">{c.email}</span>}
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Activity Timeline */}
      {activities.length > 0 && (
        <GlassPanel depth="surface" className="p-5 md:col-span-2">
          <h3 className="text-label-sm uppercase tracking-[0.1em] text-on-surface-muted/40 mb-3 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Activity Timeline
          </h3>
          <div className="space-y-0.5 max-h-64 overflow-y-auto scrollbar-thin">
            {activities.map((a: CRMActivity) => {
              const Icon = ACTIVITY_ICONS[a.activity_type] || Circle
              return (
                <div key={a.id} className="flex items-center gap-2 py-1 px-2">
                  <Icon className="w-3 h-3 text-on-surface-muted/30 flex-shrink-0" />
                  <span className="text-[11px] text-on-surface/60 flex-1 truncate">{a.title}</span>
                  <span className="text-[10px] text-on-surface-muted/25 font-mono">{a.source}</span>
                  <span className="text-[10px] text-on-surface-muted/25">{formatRelative(a.created_at)}</span>
                </div>
              )
            })}
          </div>
        </GlassPanel>
      )}

      {/* Notes (legacy signal log) */}
      {Array.isArray(intel.client?.notes) && intel.client.notes.length > 0 && (
        <GlassPanel depth="surface" className="p-5 md:col-span-2">
          <h3 className="text-label-sm uppercase tracking-[0.1em] text-on-surface-muted/40 mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Signal Log
          </h3>
          <div className="space-y-2">
            {intel.client.notes.slice(0, 10).map((n: any, i: number) => (
              <div key={i} className="rounded-xl bg-surface-container-low/60 p-4">
                <p className="text-sm leading-relaxed text-on-surface-variant">{n.content}</p>
                <p className="mt-1.5 font-mono text-[10px] text-on-surface-muted/30">
                  {n.source} · {new Date(n.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  )
}
