/**
 * SocialsPanel — unified communications context panel embedded in Cortex.
 * Shows combined inbox across Gmail, LinkedIn DMs, and Meta conversations
 * with live stats, quick actions, and platform filtering.
 */
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { getGmailStats, getThreads, archiveThread, markRead } from '@/api/gmail'
import { getDMStats, getDMs } from '@/api/linkedin'
import { getMetaStats, getMetaConversations } from '@/api/meta'
import { cn } from '@/lib/utils'
import {
  Mail, Linkedin, MessageCircle, AlertTriangle, Eye, Archive,
  ChevronRight, ChevronDown, Layers,
} from 'lucide-react'
import type { EmailThread } from '@/types/gmail'

// ── Shared helpers ──────────────────────────────────────────────────

function timeAgo(d: string) {
  const ms = Date.now() - new Date(d).getTime()
  const mins = Math.floor(ms / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  if (mins < 1440) return `${Math.floor(mins / 60)}h`
  return `${Math.floor(mins / 1440)}d`
}

function PriorityDot({ priority }: { priority?: string | null }) {
  if (!priority || priority === 'normal') return null
  const color: Record<string, string> = { urgent: 'bg-error', high: 'bg-gold', low: 'bg-on-surface-muted/10', spam: 'bg-on-surface-muted/5' }
  return <div className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', color[priority] || 'bg-on-surface-muted/10')} />
}

function Empty({ label }: { label: string }) {
  return <div className="px-2 py-3 text-[9px] text-on-surface-muted/20">{label}</div>
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
          <span className="ml-auto rounded-full bg-primary/8 px-1.5 text-[9px] text-primary/50 tabular-nums">{badge}</span>
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

// ── Stats Strip ─────────────────────────────────────────────────────

function StatsStrip() {
  const { data: gmail } = useQuery({ queryKey: ['gmail-stats'], queryFn: getGmailStats, staleTime: 15_000 })
  const { data: linkedin } = useQuery({ queryKey: ['li-dm-stats'], queryFn: getDMStats, staleTime: 15_000 })
  const { data: meta } = useQuery({ queryKey: ['meta-stats'], queryFn: getMetaStats, staleTime: 30_000 })

  return (
    <div className="flex items-center gap-3 px-2 py-2 overflow-x-auto scrollbar-none border-b border-black/3">
      <StatChip icon={Mail} label="Gmail" value={gmail?.unread || 0} urgent={gmail?.urgent || 0} />
      <StatChip icon={Linkedin} label="LinkedIn" value={linkedin?.unread || 0} urgent={linkedin?.high_priority || 0} leads={linkedin?.leads || 0} />
      <StatChip icon={MessageCircle} label="Meta" value={meta?.total_conversations || 0} />
    </div>
  )
}

function StatChip({ icon: Icon, label, value, urgent, leads }: {
  icon: any; label: string; value: number; urgent?: number; leads?: number
}) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <Icon size={11} className="text-on-surface-muted/30" />
      <span className="text-[10px] text-on-surface-muted/40">{label}</span>
      <span className={cn('text-xs font-medium tabular-nums', value > 0 ? 'text-on-surface-muted/70' : 'text-on-surface-muted/20')}>{value}</span>
      {urgent != null && urgent > 0 && (
        <span className="flex items-center gap-0.5 text-[9px] text-error/60"><AlertTriangle size={8} />{urgent}</span>
      )}
      {leads != null && leads > 0 && (
        <span className="text-[9px] text-gold/50">{leads} leads</span>
      )}
    </div>
  )
}

// ── Platform filter ─────────────────────────────────────────────────

type Platform = 'all' | 'gmail' | 'linkedin' | 'meta'

function PlatformTabs({ active, onChange }: { active: Platform; onChange: (p: Platform) => void }) {
  const tabs: { key: Platform; label: string; icon: any }[] = [
    { key: 'all', label: 'All', icon: Layers },
    { key: 'gmail', label: 'Gmail', icon: Mail },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { key: 'meta', label: 'Meta', icon: MessageCircle },
  ]
  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={cn('flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-medium transition-all',
            active === t.key ? 'bg-primary/10 text-primary' : 'text-on-surface-muted/25 hover:text-on-surface-muted/50')}>
          <t.icon size={9} /> {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Gmail ───────────────────────────────────────────────────────────

function GmailSection() {
  const qc = useQueryClient()
  const { data: raw } = useQuery({
    queryKey: ['socials-gmail-unread'], staleTime: 10_000,
    queryFn: () => getThreads({ status: 'unread', limit: 10 }),
  })

  // getThreads returns { threads: [...], total } — extract array
  const threads: EmailThread[] = Array.isArray(raw) ? raw : (raw?.threads || [])
  if (!threads.length) return <Empty label="Inbox zero" />

  const remove = (id: string) => {
    qc.setQueryData(['socials-gmail-unread'], (old: any) => {
      if (!old) return old
      if (Array.isArray(old)) return old.filter((t: any) => t.id !== id)
      return { ...old, threads: (old.threads || []).filter((t: any) => t.id !== id) }
    })
    qc.invalidateQueries({ queryKey: ['gmail-stats'] })
  }

  return (
    <div className="space-y-px">
      {threads.slice(0, 8).map(t => (
        <div key={t.id} className="group flex items-start gap-1.5 rounded-lg px-2 py-1.5 hover:bg-surface-container/30 transition-colors">
          <PriorityDot priority={t.triage_priority} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="truncate text-[10px] font-medium text-on-surface-muted/60">
                {t.from_name || t.from_email?.split('@')[0]}
              </span>
              {t.received_at && <span className="text-[8px] text-on-surface-muted/15 flex-shrink-0">{timeAgo(t.received_at)}</span>}
            </div>
            <div className="truncate text-[9px] text-on-surface-muted/35">{t.subject}</div>
            {t.triage_summary && <div className="truncate text-[8px] text-on-surface-muted/20 mt-0.5">{t.triage_summary}</div>}
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
            <button onClick={() => { remove(t.id); markRead(t.id) }} title="Mark read"
              className="rounded p-0.5 text-on-surface-muted/15 hover:text-green-400/60"><Eye size={9} /></button>
            <button onClick={() => { remove(t.id); archiveThread(t.id) }} title="Archive"
              className="rounded p-0.5 text-on-surface-muted/15 hover:text-on-surface-muted/50"><Archive size={9} /></button>
          </div>
        </div>
      ))}
      {threads.length > 8 && <div className="px-2 py-1 text-[8px] text-on-surface-muted/15">+{threads.length - 8} more</div>}
    </div>
  )
}

// ── LinkedIn DMs ────────────────────────────────────────────────────

function LinkedInSection() {
  const { data: raw } = useQuery({
    queryKey: ['socials-li-dms'], staleTime: 15_000,
    queryFn: () => getDMs({ status: 'unread', limit: 10 }),
  })

  // getDMs returns { dms: [...], total } — extract array
  const dms = raw?.dms || []
  if (!dms.length) return <Empty label="No unread DMs" />

  return (
    <div className="space-y-px">
      {dms.slice(0, 8).map((dm: any) => (
        <div key={dm.id} className="flex items-start gap-1.5 rounded-lg px-2 py-1.5 hover:bg-surface-container/30 transition-colors">
          <PriorityDot priority={dm.priority} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="truncate text-[10px] font-medium text-on-surface-muted/60">{dm.participant_name}</span>
              {dm.category === 'lead' && <span className="text-[8px] text-gold/50 flex-shrink-0">lead</span>}
              {dm.lead_score > 0 && <span className="text-[8px] text-gold/30 flex-shrink-0">{dm.lead_score}%</span>}
              {dm.last_message_at && <span className="text-[8px] text-on-surface-muted/15 flex-shrink-0">{timeAgo(dm.last_message_at)}</span>}
            </div>
            {dm.participant_company && <div className="truncate text-[8px] text-on-surface-muted/25">{dm.participant_company}{dm.participant_headline ? ` · ${dm.participant_headline}` : ''}</div>}
            {dm.triage_summary && <div className="truncate text-[8px] text-on-surface-muted/20 mt-0.5">{dm.triage_summary}</div>}
          </div>
          {dm.message_count > 1 && <span className="text-[8px] text-on-surface-muted/15 tabular-nums flex-shrink-0">{dm.message_count}</span>}
        </div>
      ))}
      {dms.length > 8 && <div className="px-2 py-1 text-[8px] text-on-surface-muted/15">+{dms.length - 8} more</div>}
    </div>
  )
}

// ── Meta Conversations ──────────────────────────────────────────────

function MetaSection() {
  const { data: raw } = useQuery({
    queryKey: ['socials-meta-convos'], staleTime: 15_000,
    queryFn: () => getMetaConversations({ limit: 10 }),
  })

  // getMetaConversations returns the array directly
  const convos = Array.isArray(raw) ? raw : []
  if (!convos.length) return <Empty label="No conversations" />

  return (
    <div className="space-y-px">
      {convos.slice(0, 8).map((c: any) => (
        <div key={c.id} className="flex items-start gap-1.5 rounded-lg px-2 py-1.5 hover:bg-surface-container/30 transition-colors">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="truncate text-[10px] font-medium text-on-surface-muted/60">{c.participant_name || 'Unknown'}</span>
              <span className={cn('text-[8px] rounded px-1', c.platform === 'instagram' ? 'bg-pink-400/10 text-pink-400/40' : 'bg-blue-400/10 text-blue-400/40')}>
                {c.platform || 'messenger'}
              </span>
              {c.last_message_at && <span className="text-[8px] text-on-surface-muted/15 flex-shrink-0">{timeAgo(c.last_message_at)}</span>}
            </div>
            {c.triage_summary && <div className="truncate text-[8px] text-on-surface-muted/20 mt-0.5">{c.triage_summary}</div>}
          </div>
          {c.unread && <div className="h-1.5 w-1.5 rounded-full bg-primary/40 flex-shrink-0 mt-1.5" />}
        </div>
      ))}
      {convos.length > 8 && <div className="px-2 py-1 text-[8px] text-on-surface-muted/15">+{convos.length - 8} more</div>}
    </div>
  )
}

// ── LinkedIn Connection Requests ────────────────────────────────────

function ConnectionSection() {
  const { data: raw } = useQuery({
    queryKey: ['socials-li-connections'], staleTime: 60_000,
    queryFn: async () => {
      const { getConnectionRequests } = await import('@/api/linkedin')
      return getConnectionRequests()
    },
  })

  const requests = Array.isArray(raw) ? raw : (raw as any)?.requests || (raw as any)?.data || []
  if (!requests.length) return <Empty label="No pending requests" />

  return (
    <div className="space-y-px">
      {requests.slice(0, 5).map((r: any) => (
        <div key={r.id} className="flex items-start gap-1.5 rounded-lg px-2 py-1.5 hover:bg-surface-container/30 transition-colors">
          <div className="flex-1 min-w-0">
            <span className="truncate text-[10px] font-medium text-on-surface-muted/60">{r.name}</span>
            {r.headline && <div className="truncate text-[8px] text-on-surface-muted/25">{r.headline}</div>}
          </div>
          {r.relevance_score != null && (
            <span className={cn('text-[8px] tabular-nums flex-shrink-0',
              r.relevance_score >= 7 ? 'text-green-400/50' : r.relevance_score >= 4 ? 'text-gold/40' : 'text-on-surface-muted/20')}>
              {r.relevance_score}/10
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Main Panel ──────────────────────────────────────────────────────

export default function SocialsPanel() {
  const [platform, setPlatform] = useState<Platform>('all')
  const { data: gmail } = useQuery({ queryKey: ['gmail-stats'], queryFn: getGmailStats, staleTime: 15_000 })
  const { data: linkedin } = useQuery({ queryKey: ['li-dm-stats'], queryFn: getDMStats, staleTime: 15_000 })

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      <StatsStrip />
      <PlatformTabs active={platform} onChange={setPlatform} />

      <div className="flex-1 space-y-0.5 px-2 pb-4">
        {(platform === 'all' || platform === 'gmail') && (
          <Section label="Gmail" icon={Mail} badge={gmail?.unread} defaultOpen>
            <GmailSection />
          </Section>
        )}

        {(platform === 'all' || platform === 'linkedin') && (
          <Section label="LinkedIn DMs" icon={Linkedin} badge={linkedin?.unread} defaultOpen={platform !== 'all'}>
            <LinkedInSection />
          </Section>
        )}

        {(platform === 'all' || platform === 'linkedin') && (
          <Section label="Connections" icon={Linkedin} defaultOpen={false}>
            <ConnectionSection />
          </Section>
        )}

        {(platform === 'all' || platform === 'meta') && (
          <Section label="Meta" icon={MessageCircle} defaultOpen={platform === 'meta'}>
            <MetaSection />
          </Section>
        )}
      </div>
    </div>
  )
}
