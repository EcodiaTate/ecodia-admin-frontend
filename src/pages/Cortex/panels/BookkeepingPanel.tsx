/**
 * BookkeepingPanel — compact financial context panel embedded in Cortex.
 * Shows live stats, pending inbox, recent ledger, and quick actions.
 * All data fetched via React Query with stale-while-revalidate.
 */
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  getStagedCounts, getStaged, postStaged, ignoreStaged, discardStaged, batchPost,
  uploadCSV, triggerCategorize, getLedgerTransactions, getDirectorLoanBalance,
  getGSTSummary, getAccounts, cents,
} from '@/api/bookkeeping'
import { cn } from '@/lib/utils'
import {
  Receipt, BookOpen, Scale, Landmark, Check, X, User, Upload, Zap,
  ChevronRight, ChevronDown,
} from 'lucide-react'

function quarter(): [string, string] {
  const now = new Date()
  const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
  const qEnd = new Date(qStart.getFullYear(), qStart.getMonth() + 3, 0)
  return [qStart.toISOString().slice(0, 10), qEnd.toISOString().slice(0, 10)]
}

// ── Stats Strip ─────────────────────────────────────────────────────
function StatsStrip() {
  const { data: counts } = useQuery({ queryKey: ['bk-counts'], queryFn: getStagedCounts, staleTime: 15_000 })
  const { data: loan } = useQuery({ queryKey: ['bk-loan'], queryFn: getDirectorLoanBalance, staleTime: 30_000 })
  const { data: gst } = useQuery({
    queryKey: ['bk-gst'], staleTime: 60_000,
    queryFn: () => { const [s, e] = quarter(); return getGSTSummary(s, e) },
  })

  const pending = (counts?.pending || 0) + (counts?.flagged || 0)

  return (
    <div className="flex items-center gap-4 px-1 py-2 overflow-x-auto scrollbar-none">
      <Stat icon={Receipt} label="Pending" value={String(pending)} accent={pending > 0 ? 'text-gold' : undefined} />
      <Stat icon={BookOpen} label="Posted" value={String(counts?.posted || 0)} />
      {loan && (
        <Stat icon={Scale}
          label={loan.direction === 'company_owes_tate' ? 'Co\u2192Tate' : 'Tate\u2192Co'}
          value={cents(Math.abs(loan.balance_cents))}
          accent={loan.balance_cents > 0 ? 'text-gold' : 'text-green-400'}
        />
      )}
      {gst && (
        <Stat icon={Landmark}
          label={gst.direction === 'owe_ato' ? 'Owe ATO' : 'Refund'}
          value={cents(Math.abs(gst.net))}
          accent={gst.direction === 'owe_ato' ? 'text-error/70' : 'text-green-400'}
        />
      )}
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

// ── Pending Inbox (compact) ─────────────────────────────────────────
function PendingInbox() {
  const qc = useQueryClient()
  const { data: rows = [], refetch } = useQuery({
    queryKey: ['bk-staged', 'pending'], queryFn: () => getStaged('pending'), staleTime: 10_000,
  })
  useQuery({ queryKey: ['bk-accounts'], queryFn: getAccounts, staleTime: 120_000 })
  const [csvSource, setCsvSource] = useState<'1000' | '2100'>('1000')
  const fileRef = { current: null as HTMLInputElement | null }

  const invalidate = () => { qc.invalidateQueries({ queryKey: ['bk-counts'] }) }
  const remove = (id: string) => {
    qc.setQueryData(['bk-staged', 'pending'], (old: any) => Array.isArray(old) ? old.filter((t: any) => t.id !== id) : old)
    invalidate()
  }

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    await uploadCSV(file, csvSource); refetch(); invalidate()
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-between px-1 py-3">
        <span className="text-xs text-on-surface-muted/30">No pending transactions</span>
        <div className="flex items-center gap-1">
          <select value={csvSource} onChange={e => setCsvSource(e.target.value as any)}
            className="rounded bg-surface-container/60 px-1.5 py-0.5 text-[9px] text-on-surface-muted/50 outline-none">
            <option value="1000">Company</option>
            <option value="2100">Personal</option>
          </select>
          <input ref={el => fileRef.current = el} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          <button onClick={() => fileRef.current?.click()} className="rounded bg-surface-container/60 px-1.5 py-0.5 text-[9px] text-on-surface-muted/50 hover:text-on-surface-muted">
            <Upload size={9} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-px">
      <div className="flex items-center justify-between px-1 py-1.5">
        <span className="text-[10px] uppercase tracking-wider text-on-surface-muted/30">{rows.length} pending</span>
        <div className="flex items-center gap-1">
          <button onClick={async () => { await triggerCategorize(); refetch(); invalidate() }}
            className="rounded px-1.5 py-0.5 text-[9px] text-on-surface-muted/40 hover:text-primary hover:bg-primary/5">
            <Zap size={9} />
          </button>
          <button onClick={async () => { await batchPost(); refetch(); invalidate() }}
            className="rounded px-1.5 py-0.5 text-[9px] text-on-surface-muted/40 hover:text-green-400 hover:bg-green-400/5">
            <Check size={9} />
          </button>
        </div>
      </div>
      {rows.slice(0, 8).map((tx: any) => (
        <div key={tx.id} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-container/30 transition-colors">
          <span className="w-10 text-[9px] text-on-surface-muted/30 flex-shrink-0 tabular-nums">
            {new Date(tx.occurred_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })}
          </span>
          <span className="flex-1 truncate text-[11px] text-on-surface-muted/70">{tx.description}</span>
          <span className={cn('text-[11px] font-medium tabular-nums flex-shrink-0', tx.amount_cents > 0 ? 'text-green-400/70' : 'text-on-surface-muted/60')}>
            {cents(tx.amount_cents)}
          </span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {tx.category && tx.category !== 'DISCARD' && (
              <button onClick={() => { remove(tx.id); postStaged(tx.id) }} title="Post"
                className="rounded p-0.5 text-green-400/50 hover:text-green-400 hover:bg-green-400/5">
                <Check size={10} />
              </button>
            )}
            <button onClick={() => { remove(tx.id); discardStaged(tx.id, true) }} title="Discard"
              className="rounded p-0.5 text-gold/40 hover:text-gold hover:bg-gold/5">
              <User size={10} />
            </button>
            <button onClick={() => { remove(tx.id); ignoreStaged(tx.id) }} title="Skip"
              className="rounded p-0.5 text-on-surface-muted/20 hover:text-on-surface-muted/50">
              <X size={10} />
            </button>
          </div>
        </div>
      ))}
      {rows.length > 8 && (
        <div className="px-2 py-1 text-[9px] text-on-surface-muted/25">+{rows.length - 8} more</div>
      )}
    </div>
  )
}

// ── Recent Ledger ───────────────────────────────────────────────────
function RecentLedger() {
  const { data: entries = [] } = useQuery({
    queryKey: ['bk-ledger-compact'], queryFn: () => getLedgerTransactions(5), staleTime: 30_000,
  })

  if (entries.length === 0) return null

  return (
    <div className="space-y-px">
      {entries.map((e: any) => (
        <div key={e.id} className="flex items-center gap-2 px-2 py-1">
          <span className="w-10 text-[9px] text-on-surface-muted/25 tabular-nums flex-shrink-0">
            {new Date(e.occurred_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })}
          </span>
          <span className="flex-1 truncate text-[10px] text-on-surface-muted/40">{e.description}</span>
          <span className="text-[10px] text-on-surface-muted/25 flex-shrink-0">{e.source_system}</span>
        </div>
      ))}
    </div>
  )
}

// ── Collapsible Section ─────────────────────────────────────────────
function Section({ label, defaultOpen = true, children }: { label: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1 px-1 py-1.5 text-[10px] uppercase tracking-wider text-on-surface-muted/30 hover:text-on-surface-muted/50 transition-colors">
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
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
export default function BookkeepingPanel() {
  return (
    <div className="flex flex-col h-full overflow-y-auto scrollbar-thin">
      <StatsStrip />
      <div className="flex-1 space-y-1 px-2 pb-4">
        <Section label="Pending Inbox" defaultOpen={true}>
          <PendingInbox />
        </Section>
        <Section label="Recent Ledger" defaultOpen={false}>
          <RecentLedger />
        </Section>
      </div>
    </div>
  )
}
