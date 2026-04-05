import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getStagedCounts, getStaged, postStaged, ignoreStaged, batchPost,
  uploadCSV, importXero, triggerCategorize,
  getLedgerTransactions, getTrialBalance,
  getBAS, getPnL, getBalanceSheet, getExpenseBreakdown, getGSTSummary,
  getDirectorLoanBalance,
  getRules, createRule, deleteRule,
  cents,
} from '@/api/bookkeeping'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { formatCurrency, cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt, BookOpen, FileSpreadsheet, Scale, Landmark, ListFilter, Upload, RefreshCw, Zap,
} from 'lucide-react'

const glide = { type: 'spring' as const, stiffness: 70, damping: 18, mass: 1.2 }

type Tab = 'inbox' | 'ledger' | 'reports' | 'director-loan' | 'rules'

function quarter(): [string, string] {
  const now = new Date()
  const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
  const qEnd = new Date(qStart.getFullYear(), qStart.getMonth() + 3, 0)
  return [qStart.toISOString().slice(0, 10), qEnd.toISOString().slice(0, 10)]
}

export default function BookkeepingPage() {
  const [tab, setTab] = useState<Tab>('inbox')
  const qc = useQueryClient()
  const { data: counts } = useQuery({ queryKey: ['bk-counts'], queryFn: getStagedCounts })
  const { data: loan } = useQuery({ queryKey: ['bk-loan'], queryFn: getDirectorLoanBalance })
  const { data: gst } = useQuery({
    queryKey: ['bk-gst'],
    queryFn: () => { const [s, e] = quarter(); return getGSTSummary(s, e) },
  })

  const pending = (counts?.pending || 0) + (counts?.flagged || 0)
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'inbox', label: 'Inbox', icon: Receipt },
    { key: 'ledger', label: 'Ledger', icon: BookOpen },
    { key: 'reports', label: 'Reports', icon: FileSpreadsheet },
    { key: 'director-loan', label: 'Director Loan', icon: Scale },
    { key: 'rules', label: 'Rules', icon: ListFilter },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <SpatialLayer z={25} className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted/60">
            Double-Entry Ledger
          </span>
          <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
            Book<em className="not-italic font-normal text-gold">keeper</em>
          </h1>
        </div>
        <div className="flex gap-4">
          <WhisperStat label="Pending" value={String(pending)} icon={Receipt} />
          {loan && <WhisperStat label={loan.direction === 'company_owes_tate' ? 'Co → Tate' : 'Tate → Co'} value={cents(Math.abs(loan.balance_cents))} icon={Scale} />}
          {gst && <WhisperStat label={gst.direction === 'owe_ato' ? 'Owe ATO' : 'ATO Refund'} value={cents(Math.abs(gst.net))} icon={Landmark} />}
        </div>
      </SpatialLayer>

      {/* Tabs */}
      <SpatialLayer z={22} className="mb-6">
        <div className="flex gap-1 rounded-xl bg-surface-container/40 p-1 backdrop-blur-sm">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                tab === key ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-muted/60 hover:text-on-surface-muted'
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </SpatialLayer>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={glide}>
          {tab === 'inbox' && <InboxTab />}
          {tab === 'ledger' && <LedgerTab />}
          {tab === 'reports' && <ReportsTab />}
          {tab === 'director-loan' && <DirectorLoanTab />}
          {tab === 'rules' && <RulesTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// INBOX TAB
// ═══════════════════════════════════════════════════════════════════════

function InboxTab() {
  const [filter, setFilter] = useState('pending')
  const fileRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()
  const { data: transactions = [], refetch } = useQuery({
    queryKey: ['bk-staged', filter],
    queryFn: () => getStaged(filter !== 'all' ? filter : undefined),
  })

  const filters = ['pending', 'flagged', 'categorized', 'posted', 'ignored', 'all']

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    await uploadCSV(file); refetch(); qc.invalidateQueries({ queryKey: ['bk-counts'] })
  }

  const handlePost = async (id: string) => { await postStaged(id); refetch(); qc.invalidateQueries({ queryKey: ['bk-counts'] }) }
  const handleIgnore = async (id: string) => { await ignoreStaged(id); refetch(); qc.invalidateQueries({ queryKey: ['bk-counts'] }) }
  const handleBatch = async () => { await batchPost(); refetch(); qc.invalidateQueries({ queryKey: ['bk-counts'] }) }

  return (
    <SpatialLayer z={18}>
      <div className="mb-4 flex items-center gap-2">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('rounded-full px-3 py-1 text-xs', filter === f ? 'bg-primary/20 text-primary' : 'text-on-surface-muted/50 hover:text-on-surface-muted')}>
            {f}
          </button>
        ))}
        <div className="flex-1" />
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 rounded-lg bg-surface-container/60 px-2.5 py-1.5 text-xs text-on-surface-muted hover:text-on-surface">
          <Upload size={12} /> CSV
        </button>
        <button onClick={() => importXero().then(() => refetch())} className="flex items-center gap-1 rounded-lg bg-surface-container/60 px-2.5 py-1.5 text-xs text-on-surface-muted hover:text-on-surface">
          <RefreshCw size={12} /> Xero
        </button>
        <button onClick={handleBatch} className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs text-primary hover:bg-primary/20">
          <Zap size={12} /> Post All
        </button>
      </div>

      <div className="space-y-px">
        {transactions.map((tx: any) => (
          <motion.div key={tx.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={glide}
            className="flex items-center gap-3 rounded-lg bg-surface-container/30 px-4 py-3 backdrop-blur-sm">
            <span className="w-20 text-xs text-on-surface-muted/50">{tx.occurred_at}</span>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm text-on-surface">{tx.description}</div>
              {tx.categorizer_reasoning && <div className="mt-0.5 truncate text-xs text-primary/60">{tx.categorizer_reasoning}</div>}
            </div>
            <span className={cn('text-sm font-medium tabular-nums', tx.amount_cents > 0 ? 'text-green-400' : 'text-on-surface')}>
              {tx.amount_cents > 0 ? '+' : ''}{cents(tx.amount_cents)}
            </span>
            {tx.category && <span className="rounded bg-surface-container px-1.5 py-0.5 text-[10px] text-on-surface-muted/60">{tx.category}</span>}
            <span className={cn('text-[10px] tabular-nums', (tx.confidence || 0) >= 0.9 ? 'text-green-400' : (tx.confidence || 0) >= 0.7 ? 'text-gold' : 'text-error')}>
              {tx.confidence ? `${(tx.confidence * 100).toFixed(0)}%` : '—'}
            </span>
            <div className="flex gap-1">
              {tx.status === 'categorized' && (
                <button onClick={() => handlePost(tx.id)} className="rounded bg-green-500/10 px-2 py-0.5 text-[10px] text-green-400 hover:bg-green-500/20">Post</button>
              )}
              {['pending', 'flagged', 'categorized'].includes(tx.status) && (
                <button onClick={() => handleIgnore(tx.id)} className="rounded bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-muted/40 hover:text-on-surface-muted">Skip</button>
              )}
            </div>
          </motion.div>
        ))}
        {transactions.length === 0 && (
          <div className="py-16 text-center text-sm text-on-surface-muted/40">Nothing matching &ldquo;{filter}&rdquo;</div>
        )}
      </div>
    </SpatialLayer>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// LEDGER TAB
// ═══════════════════════════════════════════════════════════════════════

function LedgerTab() {
  const [view, setView] = useState<'journal' | 'trial'>('journal')
  const { data: entries = [] } = useQuery({ queryKey: ['bk-ledger'], queryFn: () => getLedgerTransactions(50) })
  const { data: trial = [] } = useQuery({ queryKey: ['bk-trial'], queryFn: () => getTrialBalance() })

  return (
    <SpatialLayer z={18}>
      <div className="mb-4 flex gap-1">
        {[{ key: 'journal' as const, label: 'Journal Entries' }, { key: 'trial' as const, label: 'Trial Balance' }].map(t => (
          <button key={t.key} onClick={() => setView(t.key)}
            className={cn('rounded-full px-3 py-1 text-xs', view === t.key ? 'bg-primary/20 text-primary' : 'text-on-surface-muted/50 hover:text-on-surface-muted')}>
            {t.label}
          </button>
        ))}
      </div>

      {view === 'journal' ? (
        <div className="space-y-px">
          {entries.map((e: any) => (
            <div key={e.id} className="rounded-lg bg-surface-container/30 px-4 py-3 backdrop-blur-sm">
              <div className="mb-2 flex justify-between">
                <div>
                  <span className="mr-3 text-xs text-on-surface-muted/50">{e.occurred_at}</span>
                  <span className="text-sm text-on-surface">{e.description}</span>
                </div>
                <span className="text-[10px] text-on-surface-muted/40">{e.source_system}</span>
              </div>
              <div className="pl-4 space-y-0.5">
                {(e.lines || []).map((l: any, i: number) => (
                  <div key={i} className="flex gap-4 text-xs text-on-surface-muted/60">
                    <span className="w-12 font-mono">{l.account_code}</span>
                    <span className="w-40">{l.account_name}</span>
                    <span className="w-16 text-right tabular-nums">{l.debit_cents ? cents(l.debit_cents) : ''}</span>
                    <span className="w-16 text-right tabular-nums">{l.credit_cents ? cents(l.credit_cents) : ''}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-surface-container/30 backdrop-blur-sm overflow-hidden">
          <div className="grid grid-cols-6 gap-2 border-b border-white/5 px-4 py-2 text-[10px] uppercase tracking-wider text-on-surface-muted/40">
            <span>Code</span><span className="col-span-2">Name</span><span>Type</span><span className="text-right">Debits</span><span className="text-right">Credits</span>
          </div>
          {trial.map((r: any) => (
            <div key={r.code} className="grid grid-cols-6 gap-2 border-b border-white/[0.03] px-4 py-2 text-xs text-on-surface-muted/70">
              <span className="font-mono">{r.code}</span>
              <span className="col-span-2">{r.name}</span>
              <span className="text-on-surface-muted/40">{r.type}</span>
              <span className="text-right tabular-nums">{cents(r.total_debit)}</span>
              <span className="text-right tabular-nums">{cents(r.total_credit)}</span>
            </div>
          ))}
        </div>
      )}
    </SpatialLayer>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// REPORTS TAB
// ═══════════════════════════════════════════════════════════════════════

function ReportsTab() {
  const [report, setReport] = useState('pnl')
  const [start, setStart] = useState(quarter()[0])
  const [end, setEnd] = useState(quarter()[1])
  const [data, setData] = useState<any>(null)

  const load = async () => {
    setData(null)
    if (report === 'pnl') setData(await getPnL(start, end))
    else if (report === 'bas') setData(await getBAS(start, end))
    else if (report === 'balance-sheet') setData(await getBalanceSheet(end))
    else if (report === 'expenses') setData(await getExpenseBreakdown(start, end))
  }

  const reports = [
    { key: 'pnl', label: 'P&L' }, { key: 'bas', label: 'BAS/GST' },
    { key: 'balance-sheet', label: 'Balance Sheet' }, { key: 'expenses', label: 'Expenses' },
  ]

  return (
    <SpatialLayer z={18}>
      <div className="mb-4 flex items-center gap-2">
        {reports.map(r => (
          <button key={r.key} onClick={() => setReport(r.key)}
            className={cn('rounded-full px-3 py-1 text-xs', report === r.key ? 'bg-primary/20 text-primary' : 'text-on-surface-muted/50')}>
            {r.label}
          </button>
        ))}
        <div className="flex-1" />
        <input type="date" value={start} onChange={e => setStart(e.target.value)} className="rounded bg-surface-container/60 px-2 py-1 text-xs text-on-surface" />
        <span className="text-on-surface-muted/30">→</span>
        <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="rounded bg-surface-container/60 px-2 py-1 text-xs text-on-surface" />
        <button onClick={load} className="rounded-lg bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20">Generate</button>
      </div>

      {data && report === 'pnl' && (
        <div className="space-y-4 rounded-lg bg-surface-container/30 p-5 backdrop-blur-sm">
          <Section label="INCOME" items={data.income_items} total={data.total_income_cents} color="text-green-400" />
          <Section label="EXPENSES" items={data.expense_items} total={data.total_expenses_cents} />
          <div className="flex justify-between border-t border-white/10 pt-3 text-base font-semibold">
            <span>Net Profit</span>
            <span className={data.net_profit_cents >= 0 ? 'text-green-400' : 'text-error'}>{cents(data.net_profit_cents)}</span>
          </div>
        </div>
      )}

      {data && report === 'bas' && (
        <div className="space-y-2 rounded-lg bg-surface-container/30 p-5 backdrop-blur-sm">
          {[
            { label: 'GST Collected', value: data.gst_collected_cents, color: 'text-error' },
            { label: 'GST Paid (Credits)', value: data.gst_paid_cents, color: 'text-green-400' },
            { label: 'Net GST', value: data.net_gst_cents, color: data.net_gst_cents > 0 ? 'text-error' : 'text-green-400' },
            { label: 'Total Sales', value: data.total_sales_cents },
            { label: 'Total Purchases', value: data.total_purchases_cents },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between border-b border-white/[0.03] py-2 text-sm">
              <span className="text-on-surface-muted/70">{label}</span>
              <span className={cn('font-medium tabular-nums', color || 'text-on-surface')}>{cents(value)}</span>
            </div>
          ))}
        </div>
      )}

      {data && report === 'balance-sheet' && (
        <div className="space-y-4 rounded-lg bg-surface-container/30 p-5 backdrop-blur-sm">
          <Section label="ASSETS" items={data.assets?.map((a: any) => ({ ...a, amount_cents: a.balance_cents }))} total={data.total_assets_cents} />
          <Section label="LIABILITIES" items={data.liabilities?.map((l: any) => ({ ...l, amount_cents: l.balance_cents }))} total={data.total_liabilities_cents} />
          <div className="flex justify-between border-t border-white/10 pt-3 text-base font-semibold">
            <span>Net Position</span><span>{cents(data.net_position_cents)}</span>
          </div>
        </div>
      )}

      {data && report === 'expenses' && (
        <div className="space-y-1 rounded-lg bg-surface-container/30 p-5 backdrop-blur-sm">
          {Object.entries(data.categories || {}).map(([code, amount]) => (
            <div key={code} className="flex justify-between border-b border-white/[0.03] py-1.5 text-sm">
              <span className="text-on-surface-muted/70">{code}</span>
              <span className="tabular-nums">{cents(amount as number)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-white/10 pt-3 font-semibold">
            <span>Total</span><span>{cents(data.total_cents)}</span>
          </div>
        </div>
      )}

      {!data && <div className="py-16 text-center text-sm text-on-surface-muted/40">Select a report and click Generate</div>}
    </SpatialLayer>
  )
}

function Section({ label, items, total, color }: { label: string; items: any[]; total: number; color?: string }) {
  return (
    <div>
      <div className="mb-2 text-[10px] uppercase tracking-wider text-on-surface-muted/40">{label}</div>
      {(items || []).map((i: any) => (
        <div key={i.account_code} className="flex justify-between py-0.5 text-sm">
          <span className="text-on-surface-muted/70">{i.account_name}</span>
          <span className={cn('tabular-nums', color || 'text-on-surface')}>{cents(i.amount_cents)}</span>
        </div>
      ))}
      <div className="mt-1 flex justify-between border-t border-white/5 pt-1 text-sm font-medium">
        <span>Total {label.toLowerCase()}</span>
        <span className={cn('tabular-nums', color || 'text-on-surface')}>{cents(total)}</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// DIRECTOR LOAN TAB
// ═══════════════════════════════════════════════════════════════════════

function DirectorLoanTab() {
  const { data } = useQuery({ queryKey: ['bk-loan'], queryFn: getDirectorLoanBalance })
  if (!data) return <div className="py-16 text-center text-sm text-on-surface-muted/40">Loading...</div>

  return (
    <SpatialLayer z={18}>
      <div className="mb-6 rounded-lg bg-surface-container/30 p-6 backdrop-blur-sm">
        <div className="text-[10px] uppercase tracking-wider text-on-surface-muted/40 mb-2">Current Balance</div>
        <div className={cn('text-3xl font-light font-display', data.balance_cents > 0 ? 'text-gold' : 'text-green-400')}>
          {cents(Math.abs(data.balance_cents))}
        </div>
        <div className="mt-2 text-sm text-on-surface-muted/50">
          {data.direction === 'company_owes_tate'
            ? 'Company owes Tate — business expenses paid from personal'
            : 'Tate owes company'}
        </div>
      </div>

      <div className="space-y-px">
        {(data.recent_transactions || []).map((t: any, i: number) => (
          <div key={i} className="flex items-center gap-3 rounded-lg bg-surface-container/30 px-4 py-2.5 backdrop-blur-sm">
            <span className="w-20 text-xs text-on-surface-muted/50">{t.date}</span>
            <span className="flex-1 text-sm text-on-surface">{t.description}</span>
            <span className="w-20 text-right text-xs tabular-nums text-error">{t.debit > 0 ? `Dr ${cents(t.debit)}` : ''}</span>
            <span className="w-20 text-right text-xs tabular-nums text-green-400">{t.credit > 0 ? `Cr ${cents(t.credit)}` : ''}</span>
          </div>
        ))}
      </div>
    </SpatialLayer>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// RULES TAB
// ═══════════════════════════════════════════════════════════════════════

function RulesTab() {
  const qc = useQueryClient()
  const { data: rules = [] } = useQuery({ queryKey: ['bk-rules'], queryFn: getRules })
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ pattern: '', supplier_name: '', account_code: '5010', gst_treatment: 'gst_inclusive', tags: '' })

  const handleCreate = async () => {
    await createRule({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) })
    setForm({ pattern: '', supplier_name: '', account_code: '5010', gst_treatment: 'gst_inclusive', tags: '' })
    setShowForm(false)
    qc.invalidateQueries({ queryKey: ['bk-rules'] })
  }

  const handleDelete = async (id: string) => {
    await deleteRule(id)
    qc.invalidateQueries({ queryKey: ['bk-rules'] })
  }

  return (
    <SpatialLayer z={18}>
      <div className="mb-4 flex justify-between">
        <span className="text-sm text-on-surface-muted/60">{rules.length} rules</span>
        <button onClick={() => setShowForm(!showForm)} className="rounded-lg bg-surface-container/60 px-3 py-1 text-xs text-on-surface-muted hover:text-on-surface">
          {showForm ? 'Cancel' : 'Add Rule'}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-lg bg-surface-container/30 p-4 backdrop-blur-sm">
          {[{ label: 'Pattern (regex)', key: 'pattern' }, { label: 'Supplier', key: 'supplier_name' }, { label: 'Account', key: 'account_code' }, { label: 'Tags (comma-sep)', key: 'tags' }].map(({ label, key }) => (
            <div key={key}>
              <label className="mb-1 block text-[10px] uppercase tracking-wider text-on-surface-muted/40">{label}</label>
              <input className="w-full rounded bg-surface-container/60 px-2 py-1.5 text-xs text-on-surface"
                value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <button onClick={handleCreate} className="col-span-2 w-fit rounded-lg bg-green-500/10 px-4 py-1.5 text-xs text-green-400 hover:bg-green-500/20">Save</button>
        </div>
      )}

      <div className="rounded-lg bg-surface-container/30 backdrop-blur-sm overflow-hidden">
        <div className="grid grid-cols-6 gap-2 border-b border-white/5 px-4 py-2 text-[10px] uppercase tracking-wider text-on-surface-muted/40">
          <span>Pattern</span><span>Supplier</span><span>Account</span><span>GST</span><span>Tags</span><span />
        </div>
        {rules.map((r: any) => (
          <div key={r.id} className="grid grid-cols-6 gap-2 border-b border-white/[0.03] px-4 py-2 text-xs text-on-surface-muted/70">
            <span className="font-mono truncate">{r.pattern}</span>
            <span>{r.supplier_name}</span>
            <span>{r.account_code}</span>
            <span className="text-on-surface-muted/40">{r.gst_treatment}</span>
            <span className="text-on-surface-muted/40 truncate">{(typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags || []).join(', ')}</span>
            <button onClick={() => handleDelete(r.id)} className="text-error/60 hover:text-error text-right">×</button>
          </div>
        ))}
      </div>
    </SpatialLayer>
  )
}
