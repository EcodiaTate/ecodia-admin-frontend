import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getFinanceSummary } from '@/api/finance'
import { TransactionList } from './TransactionList'
import { CategoryChart } from './CategoryChart'
import { ReconcilePanel } from './ReconcilePanel'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { AmbientPulse } from '@/components/spatial/AmbientPulse'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import { formatCurrency, cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { WorkerStatus } from '@/store/workerStore'

export default function FinancePage() {
  const [tab, setTab] = useState<'all' | 'uncategorized'>('all')
  const { data: summary } = useQuery({ queryKey: ['financeSummary'], queryFn: getFinanceSummary })
  const financeWorker = useWorkerStatus('finance') as WorkerStatus | null

  const net = summary?.net ?? 0

  const tabs = [
    { key: 'all' as const, label: 'Protocol Ledger' },
    { key: 'uncategorized' as const, label: 'Uncategorized' },
  ]

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
            Capital Flow
          </span>
          <h1 className="mt-3 font-display text-display-md font-light text-on-surface">
            Financial <em className="not-italic font-normal text-primary">Ecosystem</em>
          </h1>
        </div>
        {financeWorker && (
          <AmbientPulse label="Xero" lastSyncAt={financeWorker.lastSync} status={financeWorker.status} />
        )}
      </div>

      {/* Hero net figure */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="mb-12"
      >
        <p className={cn(
          'font-display text-display-lg font-light tabular-nums',
          net >= 0 ? 'text-secondary' : 'text-error',
        )}>
          {formatCurrency(net)}
        </p>
        <span className="mt-2 block text-label-sm uppercase tracking-[0.08em] text-on-surface-muted/40">
          Net · month to date
        </span>
      </motion.div>

      {/* Whisper stats: Income + Expenses */}
      <div className="mb-14 flex gap-12">
        <WhisperStat
          label="Income"
          value={formatCurrency(summary?.income ?? 0)}
          icon={TrendingUp}
          accent="text-secondary"
          subtext="Month to date"
        />
        <WhisperStat
          label="Expenses"
          value={formatCurrency(summary?.expenses ?? 0)}
          icon={TrendingDown}
          accent="text-tertiary"
          subtext="Month to date"
        />
      </div>

      <CategoryChart />

      <div className="mt-12 mb-6 flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'relative rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              tab === t.key
                ? 'text-primary'
                : 'text-on-surface-muted hover:bg-surface-container-low hover:text-on-surface-variant',
            )}
          >
            {tab === t.key && (
              <motion.div
                layoutId="finance-tab-bg"
                className="absolute inset-0 rounded-xl bg-primary/10"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: tab === 'uncategorized' ? 20 : -20, scale: 0.98 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: tab === 'uncategorized' ? -20 : 20, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 250, damping: 25 }}
        >
          {tab === 'all' ? <TransactionList /> : <ReconcilePanel />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
