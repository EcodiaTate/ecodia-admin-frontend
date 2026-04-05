/**
 * GmailPanel — compact email context panel embedded in Cortex.
 * Shows inbox stats, unread threads, urgent items, and quick actions.
 */
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getThreads, archiveThread, markRead, trashThread,
  getGmailStats,
} from '@/api/gmail'
import { cn } from '@/lib/utils'
import {
  Mail, AlertTriangle, Star, Archive, Eye,
  ChevronRight, ChevronDown, Zap,
} from 'lucide-react'
import type { EmailThread } from '@/types/gmail'

// ── Stats Strip ─────────────────────────────────────────────────────
function StatsStrip() {
  const { data: stats } = useQuery({ queryKey: ['gmail-stats'], queryFn: getGmailStats, staleTime: 15_000 })
  if (!stats) return null

  return (
    <div className="flex items-center gap-4 px-1 py-2 overflow-x-auto scrollbar-none">
      <Stat icon={Mail} label="Unread" value={String(stats.unread || 0)} accent={stats.unread > 0 ? 'text-primary' : undefined} />
      <Stat icon={AlertTriangle} label="Urgent" value={String(stats.urgent || 0)} accent={stats.urgent > 0 ? 'text-error/70' : undefined} />
      <Stat icon={Star} label="High" value={String(stats.high || 0)} accent={stats.high > 0 ? 'text-gold' : undefined} />
      {stats.pending_triage > 0 && <Stat icon={Zap} label="Triaging" value={String(stats.pending_triage)} accent="text-primary/60" />}
    </div>
  )
}

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <Icon size={11} className="text-on-surface-muted/30" />
      <span className="text-[10px] text-on-surface-muted/40">{label}</span>
      <span className={cn('text-xs font-medium tabular-nums', accent || 'text-on-surface-muted/70')}>{value}</span>
    </div>
  )
}

// ── Priority Badge ──────────────────────────────────────────────────
function PriorityDot({ priority }: { priority: string }) {
  const color = {
    urgent: 'bg-error',
    high: 'bg-gold',
    normal: 'bg-on-surface-muted/20',
    low: 'bg-on-surface-muted/10',
    spam: 'bg-on-surface-muted/5',
  }[priority] || 'bg-on-surface-muted/10'
  return <div className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', color)} />
}

// ── Thread List ─────────────────────────────────────────────────────
function ThreadList({ status, limit = 8 }: { status: string; limit?: number }) {
  const qc = useQueryClient()
  const { data: threads = [] } = useQuery({
    queryKey: ['gmail-threads', status],
    queryFn: async () => { const r = await getThreads({ status, limit: limit + 2 }); return r.threads || r },
    staleTime: 10_000,
  })
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['gmail-stats'] }) }
  const remove = (id: string) => {
    qc.setQueryData(['gmail-threads', status], (old: any) =>
      Array.isArray(old) ? old.filter((t: any) => t.id !== id) : old
    )
    if (expandedId === id) setExpandedId(null)
    invalidate()
  }

  if (threads.length === 0) {
    return <div className="px-2 py-3 text-xs text-on-surface-muted/25">No {status} threads</div>
  }

  const timeAgo = (d: string) => {
    const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (mins < 60) return `${mins}m`
    if (mins < 1440) return `${Math.floor(mins / 60)}h`
    return `${Math.floor(mins / 1440)}d`
  }

  return (
    <div className="space-y-px">
      {threads.slice(0, limit).map((t: EmailThread) => (
        <div key={t.id}>
          <div
            onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
            className="group flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-container/30 cursor-pointer transition-colors"
          >
            <PriorityDot priority={t.triage_priority ?? 'normal'} />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="truncate text-[11px] font-medium text-on-surface-muted/70">{t.from_name || t.from_email?.split('@')[0]}</span>
                <span className="text-[9px] text-on-surface-muted/20 flex-shrink-0">{t.received_at ? timeAgo(t.received_at) : ''}</span>
              </div>
              <div className="truncate text-[10px] text-on-surface-muted/40">{t.subject}</div>
              {t.triage_summary && (
                <div className="truncate text-[9px] text-on-surface-muted/25 mt-0.5">{t.triage_summary}</div>
              )}
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
              <button onClick={e => { e.stopPropagation(); remove(t.id); archiveThread(t.id) }} title="Archive"
                className="rounded p-0.5 text-on-surface-muted/20 hover:text-on-surface-muted/50">
                <Archive size={10} />
              </button>
              <button onClick={e => { e.stopPropagation(); remove(t.id); markRead(t.id) }} title="Read"
                className="rounded p-0.5 text-on-surface-muted/20 hover:text-green-400/60">
                <Eye size={10} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {expandedId === t.id && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="ml-4 px-2 py-2 space-y-2 border-l border-on-surface-muted/5">
                  {t.triage_summary && (
                    <div className="text-[10px] text-on-surface-muted/40 leading-relaxed">{t.triage_summary}</div>
                  )}
                  {t.triage_action && (
                    <div className="text-[9px] text-primary/50">Suggested: {t.triage_action}</div>
                  )}
                  <div className="text-[10px] text-on-surface-muted/30 leading-relaxed line-clamp-4">
                    {t.snippet || '(no preview)'}
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <button onClick={() => { remove(t.id); archiveThread(t.id) }}
                      className="rounded px-2 py-0.5 text-[9px] text-on-surface-muted/40 hover:text-on-surface-muted/60 hover:bg-surface-container/40">
                      Archive
                    </button>
                    <button onClick={() => { remove(t.id); trashThread(t.id) }}
                      className="rounded px-2 py-0.5 text-[9px] text-on-surface-muted/40 hover:text-error/60 hover:bg-error/5">
                      Trash
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
      {threads.length > limit && (
        <div className="px-2 py-1 text-[9px] text-on-surface-muted/20">+{threads.length - limit} more</div>
      )}
    </div>
  )
}

// ── Collapsible Section ─────────────────────────────────────────────
function Section({ label, defaultOpen = true, badge, children }: { label: string; defaultOpen?: boolean; badge?: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1 px-1 py-1.5 text-[10px] uppercase tracking-wider text-on-surface-muted/30 hover:text-on-surface-muted/50 transition-colors">
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        {label}
        {badge != null && badge > 0 && (
          <span className="ml-auto rounded-full bg-primary/10 px-1.5 text-[9px] text-primary/60 tabular-nums">{badge}</span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Panel ──────────────────────────────────────────────────────
export default function GmailPanel() {
  const { data: stats } = useQuery({ queryKey: ['gmail-stats'], queryFn: getGmailStats, staleTime: 15_000 })

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      <StatsStrip />
      <div className="flex-1 space-y-1 px-2 pb-4">
        <Section label="Unread" defaultOpen={true} badge={stats?.unread}>
          <ThreadList status="unread" limit={8} />
        </Section>
        <Section label="Triaged" defaultOpen={false}>
          <ThreadList status="triaged" limit={5} />
        </Section>
      </div>
    </div>
  )
}
