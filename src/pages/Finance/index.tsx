import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { syncFinance } from '@/api/finance'
import { TransactionList } from './TransactionList'
import { CategoryChart } from './CategoryChart'
import { ReconcilePanel } from './ReconcilePanel'
import toast from 'react-hot-toast'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function FinancePage() {
  const [tab, setTab] = useState<'all' | 'uncategorized'>('all')
  const queryClient = useQueryClient()

  const sync = useMutation({
    mutationFn: syncFinance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] })
      toast.success('Xero sync complete')
    },
    onError: () => toast.error('Sync failed'),
  })

  const tabs = [
    { key: 'all' as const, label: 'Protocol Ledger', idx: 0 },
    { key: 'uncategorized' as const, label: 'Uncategorized', idx: 1 },
  ]

  return (
    <div className="max-w-5xl">
      <div className="mb-16 flex items-start justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
            Capital Flow
          </span>
          <h1 className="mt-3 font-display text-display-md font-light text-on-surface">
            Financial <em className="not-italic font-normal text-primary">Ecosystem</em>
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-on-surface-muted">
            Atmospheric oversight of capital flow and resource allocation across the Ecodia network.
          </p>
        </div>
        <motion.button
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${sync.isPending ? 'animate-spin' : ''}`} strokeWidth={1.75} />
          Sync Data
        </motion.button>
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
