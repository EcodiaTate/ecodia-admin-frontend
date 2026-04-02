import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getFinanceSummary } from '@/api/finance'
import { TransactionList } from './TransactionList'
import { CategoryChart } from './CategoryChart'
import { ReconcilePanel } from './ReconcilePanel'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { AmbientPulse } from '@/components/spatial/AmbientPulse'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import { formatCurrency, cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { WorkerStatus } from '@/store/workerStore'

const glide = { type: 'spring' as const, stiffness: 70, damping: 18, mass: 1.2 }

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
    <div className="mx-auto max-w-5xl">
      <SpatialLayer z={25} className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted/60">
            Capital Flow
          </span>
          <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
            Financial <em className="not-italic font-normal text-gold">Ecosystem</em>
          </h1>
        </div>
        {financeWorker && (
          <AmbientPulse label="Xero" lastSyncAt={financeWorker.lastSync} status={financeWorker.status} />
        )}
      </SpatialLayer>

      {/* Hero net — floats forward */}
      <SpatialLayer z={20}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={glide}
          className="mb-12 text-center sm:text-left md:pl-6"
        >
          <p className={cn(
            'font-display text-4xl font-light tabular-nums sm:text-display-lg',
            net >= 0 ? 'text-secondary' : 'text-error',
          )}>
            {formatCurrency(net)}
          </p>
          <span className="mt-2 block text-label-sm uppercase tracking-[0.08em] text-on-surface-muted/40">
            Net · month to date
          </span>
        </motion.div>
      </SpatialLayer>

      {/* Whisper stats — content plane */}
      <SpatialLayer z={10} className="mb-14 flex flex-wrap gap-6 sm:gap-10 md:justify-end">
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
      </SpatialLayer>

      {/* Chart — slightly recessed */}
      <SpatialLayer z={-5} className="mx-auto max-w-md md:max-w-lg">
        <CategoryChart />
      </SpatialLayer>

      <SpatialLayer z={-10}>
        <div className="mt-12 mb-6 flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'relative rounded-xl px-3 py-1.5 text-sm font-medium transition-colors sm:px-4 sm:py-2',
                tab === t.key
                  ? 'text-primary'
                  : 'text-on-surface-muted hover:bg-surface-container-low hover:text-on-surface-variant',
              )}
            >
              {tab === t.key && (
                <motion.div
                  layoutId="finance-tab-bg"
                  className="absolute inset-0 rounded-xl bg-primary/10"
                  transition={glide}
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
            transition={glide}
          >
            {tab === 'all' ? <TransactionList /> : <ReconcilePanel />}
          </motion.div>
        </AnimatePresence>
      </SpatialLayer>
    </div>
  )
}
