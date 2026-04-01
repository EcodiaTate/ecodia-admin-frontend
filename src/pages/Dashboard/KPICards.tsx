import { useQuery } from '@tanstack/react-query'
import { getFinanceSummary } from '@/api/finance'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'

export function KPICards() {
  const { data } = useQuery({ queryKey: ['financeSummary'], queryFn: getFinanceSummary })

  const net = data?.net ?? 0
  const cards = [
    { label: 'Income', value: formatCurrency(data?.income ?? 0), icon: TrendingUp, accent: 'text-secondary' },
    { label: 'Expenses', value: formatCurrency(data?.expenses ?? 0), icon: TrendingDown, accent: 'text-tertiary' },
    { label: 'Net', value: formatCurrency(net), icon: DollarSign, accent: net >= 0 ? 'text-secondary' : 'text-error' },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24, delay: i * 0.08 }}
          className="glass rounded-3xl p-8"
        >
          <div className="flex items-center justify-between">
            <span className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">{card.label}</span>
            <card.icon className={`h-4 w-4 ${card.accent}`} strokeWidth={1.75} />
          </div>
          <p className={`mt-4 font-display text-headline-md text-[1.75rem] font-light ${card.accent}`}>
            {card.value}
          </p>
          <span className="mt-1 block text-label-sm text-on-surface-muted">Month to date</span>
        </motion.div>
      ))}
    </div>
  )
}
