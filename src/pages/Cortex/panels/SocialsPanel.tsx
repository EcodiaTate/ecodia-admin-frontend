/**
 * SocialsPanel — unified communications context panel embedded in Cortex.
 * Shows combined inbox across Gmail, LinkedIn DMs, and Meta conversations.
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
  ChevronRight, ChevronDown, Users,
} from 'lucide-react'
import type { EmailThread } from '@/types/gmail'

// ── Stats Strip ─────────────────────────────────────────────────────
function StatsStrip() {
  const { data: gmail } = useQuery({ queryKey: ['gmail-stats'], queryFn: getGmailStats, staleTime: 15_000 })
  const { data: linkedin } = useQuery({ queryKey: ['li-dm-stats'], queryFn: getDMStats, staleTime: 15_000 })
  const { data: meta } = useQuery({ queryKey: ['meta-stats'], queryFn: getMetaStats, staleTime: 30_000 })

  const gmailUnread = gmail?.unread || 0
  const liUnread = linkedin?.unread || 0
  const metaUnread = meta?.total_conversations || 0

  return (
    <div className="flex items-center gap-3 px-2 py-2 overflow-x-auto scrollbar-none">
      <PlatformStat icon={Mail} label="Gmail" value={gmailUnread} urgent={gmail?.urgent || 0} />
      <PlatformStat icon={Linkedin} label="LinkedIn" value={liUnread} urgent={linkedin?.high_priority || 0} />
      <PlatformStat icon={MessageCircle} label="Meta" value={metaUnread} />
    </div>
  )
}

function PlatformStat({ icon: Icon, label, value, urgent }: { icon: any; label: string; value: number; urgent?: number }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <Icon size={11} className="text-on-surface-muted/30" />
      <span className="text-[10px] text-on-surface-muted/40">{label}</span>
      <span className={cn('text-xs font-medium tabular-nums', value > 0 ? 'text-on-surface-muted/70' : 'text-on-surface-muted/25')}>{value}</span>
      {urgent != null && urgent > 0 && (
        <span className="flex items-center gap-0.5 text-[9px] text-error/60">
          <AlertTriangle size={8} />{urgent}
        </span>
      )}
    </div>
  )
}

// ── Platform filter tabs ────────────────────────────────────────────
type Platform = 'all' | 'gmail' | 'linkedin' | 'meta'

function PlatformTabs({ active, onChange }: { active: Platform; onChange: (p: Platform) => void }) {
  const tabs: { key: Platform; label: string; icon: any }[] = [
    { key: 'all', label: 'All', icon: Users },
    { key: 'gmail', label: 'Gmail', icon: Mail },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { key: 'meta', label: 'Meta', icon: MessageCircle },
  ]
  return (
    <div className="flex items-center gap-0.5 px-1 py-1">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium transition-all',
            active === t.key ? 'bg-primary/10 text-primary' : 'text-on-surface-muted/30 hover:text-on-surface-muted/50')}>
          <t.icon size={9} /> {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Unified message item ────────────────────────────────────────────
function PriorityDot({ priority }: { priority?: string }) {
  if (!priority || priority === 'normal') return null
  const color = { urgent: 'bg-error', high: 'bg-gold', low: 'bg-on-surface-muted/10', spam: 'bg-on-surface-muted/5' }[priority] || 'bg-on-surface-muted/10'
  return <div className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', color)} />
}

function PlatformIcon({ platform }: { platform: string }) {
  const cls = 'h-3 w-3 flex-shrink-0'
  if (platform === 'gmail') return <Mail className={cn(cls, 'text-blue-400/50')} />
  if (platform === 'linkedin') return <Linkedin className={cn(cls, 'text-sky-400/50')} />
  return <MessageCircle className={cn(cls, 'text-purple-400/50')} />
}

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 60) return `${mins}m`
  if (mins < 1440) return `${Math.floor(mins / 60)}h`
  return `${Math.floor(mins / 1440)}d`
}

// ── Gmail thread list ───────────────────────────────────────────────
function GmailSection() {
  const qc = useQueryClient()
  const { data: raw = {} } = useQuery({
    queryKey: ['gmail-threads', 'unread'], staleTime: 10_000,
    queryFn: async () => getThreads({ status: 'unread', limit: 8 }),
  })
  const threads = (raw as any).threads || raw
  if (!Array.isArray(threads) || threads.length === 0) return <Empty label="No unread emails" />

  const remove = (id: string) => {
    qc.setQueryData(['gmail-threads', 'unread'], (old: any) => {
      if (!old) return old
      const arr = old.threads || old
      return { ...old, threads: Array.isArray(arr) ? arr.filter((t: any) => t.id !== id) : arr }
    })
    qc.invalidateQueries({ queryKey: ['gmail-stats'] })
  }

  return (
    <div className="space-y-px">
      {(threads as EmailThread[]).slice(0, 8).map(t => (
        <div key={t.id} className="group flex items-start gap-1.5 rounded-lg px-2 py-1.5 hover:bg-surface-container/30 transition-colors">
          <PlatformIcon platform="gmail" />
          <PriorityDot priority={t.triage_priority ?? undefined} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="truncate text-[10px] font-medium text-on-surface-muted/60">{t.from_name || t.from_email?.split('@')[0]}</span>
              <span className="text-[8px] text-on-surface-muted/20 flex-shrink-0">{t.received_at ? timeAgo(t.received_at) : ''}</span>
            </div>
            <div className="truncate text-[9px] text-on-surface-muted/35">{t.subject}</div>
          </div>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={() => { remove(t.id); archiveThread(t.id) }} className="rounded p-0.5 text-on-surface-muted/20 hover:text-on-surface-muted/50">
              <Archive size={9} />
            </button>
            <button onClick={() => { remove(t.id); markRead(t.id) }} className="rounded p-0.5 text-on-surface-muted/20 hover:text-green-400/60">
              <Eye size={9} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── LinkedIn DM list ────────────────────────────────────────────────
function LinkedInSection() {
  const { data: raw = {} } = useQuery({
    queryKey: ['li-dms-unread'], staleTime: 15_000,
    queryFn: () => getDMs({ status: 'unread', limit: 8 }),
  })
  const dms = (raw as any).data || raw
  if (!Array.isArray(dms) || dms.length === 0) return <Empty label="No unread LinkedIn DMs" />

  return (
    <div className="space-y-px">
      {dms.slice(0, 8).map((dm: any) => (
        <div key={dm.id} className="flex items-start gap-1.5 rounded-lg px-2 py-1.5 hover:bg-surface-container/30 transition-colors">
          <PlatformIcon platform="linkedin" />
          <PriorityDot priority={dm.priority} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="truncate text-[10px] font-medium text-on-surface-muted/60">{dm.participant_name}</span>
              {dm.lead_score > 0 && <span className="text-[8px] text-gold/50">{dm.lead_score}%</span>}
              <span className="text-[8px] text-on-surface-muted/20 flex-shrink-0">{dm.last_message_at ? timeAgo(dm.last_message_at) : ''}</span>
            </div>
            {dm.triage_summary && <div className="truncate text-[9px] text-on-surface-muted/30">{dm.triage_summary}</div>}
            {dm.participant_company && <div className="truncate text-[8px] text-on-surface-muted/20">{dm.participant_company}</div>}
          </div>
          {dm.category === 'lead' && <span className="text-[8px] text-gold/40 flex-shrink-0">lead</span>}
        </div>
      ))}
    </div>
  )
}

// ── Meta conversations list ─────────────────────────────────────────
function MetaSection() {
  const { data: raw = [] } = useQuery({
    queryKey: ['meta-convos'], staleTime: 15_000,
    queryFn: () => getMetaConversations({ limit: 8 }),
  })
  const convos = Array.isArray(raw) ? raw : (raw as any).conversations || raw
  if (!Array.isArray(convos) || convos.length === 0) return <Empty label="No Meta conversations" />

  return (
    <div className="space-y-px">
      {convos.slice(0, 8).map((c: any) => (
        <div key={c.id} className="flex items-start gap-1.5 rounded-lg px-2 py-1.5 hover:bg-surface-container/30 transition-colors">
          <PlatformIcon platform="meta" />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="truncate text-[10px] font-medium text-on-surface-muted/60">{c.participant_name || 'Unknown'}</span>
              <span className="text-[8px] rounded bg-purple-400/10 px-1 text-purple-400/40">{c.platform || 'messenger'}</span>
              {c.last_message_at && <span className="text-[8px] text-on-surface-muted/20 flex-shrink-0">{timeAgo(c.last_message_at)}</span>}
            </div>
            {c.triage_summary && <div className="truncate text-[9px] text-on-surface-muted/30">{c.triage_summary}</div>}
          </div>
          {c.unread && <div className="h-1.5 w-1.5 rounded-full bg-primary/40 flex-shrink-0 mt-1" />}
        </div>
      ))}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return <div className="px-2 py-2 text-[9px] text-on-surface-muted/20">{label}</div>
}

// ── Collapsible Section ─────────────────────────────────────────────
function Section({ label, icon: Icon, defaultOpen = true, children }: { label: string; icon: any; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1 px-1 py-1.5 text-[10px] uppercase tracking-wider text-on-surface-muted/30 hover:text-on-surface-muted/50 transition-colors">
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <Icon size={10} className="text-on-surface-muted/20" />
        {label}
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
export default function SocialsPanel() {
  const [platform, setPlatform] = useState<Platform>('all')

  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      <StatsStrip />
      <PlatformTabs active={platform} onChange={setPlatform} />
      <div className="flex-1 space-y-1 px-2 pb-4">
        {(platform === 'all' || platform === 'gmail') && (
          <Section label="Gmail" icon={Mail} defaultOpen={platform === 'all' || platform === 'gmail'}>
            <GmailSection />
          </Section>
        )}
        {(platform === 'all' || platform === 'linkedin') && (
          <Section label="LinkedIn DMs" icon={Linkedin} defaultOpen={platform === 'linkedin'}>
            <LinkedInSection />
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
