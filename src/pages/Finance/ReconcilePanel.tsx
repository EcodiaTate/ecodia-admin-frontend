import { useQuery } from '@tanstack/react-query'
import { getTransactions } from '@/api/finance'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '@/types/finance'
import { motion } from 'framer-motion'

// ─── Pending Classification ────────────────────────────────────────────
// These are transactions the system hasn't yet categorized.
// They surface here as observation — Cortex will propose categories
// as action_cards. No manual picker. The system handles it.

export function ReconcilePanel() {
  const { data } = useQuery({
    queryKey: ['transactions', 'uncategorized'],
    queryFn: () => getTransactions({ status: 'uncategorized', limit: 50 }),
  })

  const transactions = data?.transactions ?? []

  if (transactions.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-on-surface-muted/30">
          Everything classified. The system is current.
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-8 font-mono text-[10px] uppercase tracking-[0.15em] text-on-surface-muted/30">
        {transactions.length} pending · Cortex is reviewing
      </p>

      <div className="space-y-1.5">
        {transactions.map((tx: Transaction, i) => (
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.02 }}
            className="flex items-center gap-5 rounded-2xl bg-white/30 px-5 py-3.5"
          >
            <span className="font-mono text-label-sm text-on-surface-muted/40 shrink-0 w-20">
              {formatDate(tx.date)}
            </span>
            <p className="flex-1 min-w-0 text-sm text-on-surface-variant/70 truncate">
              {tx.description}
            </p>
            <span className={`font-mono text-sm shrink-0 ${tx.type === 'credit' ? 'text-secondary/60' : 'text-on-surface-muted/50'}`}>
              {tx.type === 'credit' ? '+' : ''}{formatCurrency(tx.amount_aud)}
            </span>
            {/* Pulse — system is aware this needs classification */}
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-tertiary/40 animate-pulse" />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
