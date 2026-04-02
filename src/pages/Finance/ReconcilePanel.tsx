import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTransactions, updateCategory } from '@/api/finance'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Transaction } from '@/types/finance'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = [
  'Software Subscriptions', 'Cloud Infrastructure', 'Contractor Payments',
  'Office/Admin', 'Marketing', 'Travel', 'Meals/Entertainment',
  'Legal/Accounting', 'Income - Software Dev', 'Income - Consulting',
  'Tax', 'Superannuation', 'Bank Fees', 'Other',
]

export function ReconcilePanel() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', 'uncategorized'],
    queryFn: () => getTransactions({ status: 'uncategorized', limit: 50 }),
  })

  const categorize = useMutation({
    mutationFn: ({ id, category }: { id: string; category: string }) =>
      updateCategory(id, category),
    onSuccess: (_, { category }) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] })
      toast.success(`Categorized as ${category}`)
      setExpandedId(null)
    },
    onError: () => toast.error('Failed to categorize'),
  })

  if (isLoading) return <LoadingSpinner />

  const transactions = data?.transactions ?? []

  if (transactions.length === 0) {
    return (
      <div className="py-16 text-center">
        <Check className="mx-auto h-6 w-6 text-secondary/30" strokeWidth={1.5} />
        <p className="mt-4 text-sm text-on-surface-muted/40">All transactions classified.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">
          Pending Classification
        </h2>
        <span className="font-mono text-label-sm text-on-surface-muted">{transactions.length} items</span>
      </div>

      <div className="space-y-2">
        {transactions.map((tx: Transaction) => (
          <TransactionRow
            key={tx.id}
            tx={tx}
            isExpanded={expandedId === tx.id}
            isPending={categorize.isPending && categorize.variables?.id === tx.id}
            onToggle={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
            onCategorize={(category) => categorize.mutate({ id: tx.id, category })}
          />
        ))}
      </div>
    </div>
  )
}

function TransactionRow({
  tx,
  isExpanded,
  isPending,
  onToggle,
  onCategorize,
}: {
  tx: Transaction
  isExpanded: boolean
  isPending: boolean
  onToggle: () => void
  onCategorize: (cat: string) => void
}) {
  return (
    <div className={`rounded-2xl transition-colors ${isExpanded ? 'bg-white/60' : 'bg-white/40 hover:bg-white/50'}`}>
      {/* Row header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm text-on-surface truncate">{tx.description}</p>
          <p className="mt-0.5 font-mono text-label-sm text-on-surface-muted">{formatDate(tx.date)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`font-mono text-sm font-medium ${tx.type === 'credit' ? 'text-secondary' : 'text-on-surface-variant'}`}>
            {tx.type === 'credit' ? '+' : ''}{formatCurrency(tx.amount_aud)}
          </span>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}>
            <ChevronDown className="h-4 w-4 text-on-surface-muted/40" strokeWidth={1.75} />
          </motion.div>
        </div>
      </button>

      {/* Category picker */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            className="overflow-hidden"
          >
            <div className="border-t border-on-surface-muted/8 px-5 pb-4 pt-3">
              <p className="mb-3 text-label-sm uppercase tracking-wider text-on-surface-muted/50">Select category</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => onCategorize(cat)}
                    disabled={isPending}
                    className="rounded-full bg-surface-container px-3 py-1.5 text-xs text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
