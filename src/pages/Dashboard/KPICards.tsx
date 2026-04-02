import { useQuery } from '@tanstack/react-query'
import { getFinanceSummary } from '@/api/finance'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { cn } from '@/lib/utils'

export function KPICards() {
  const { data } = useQuery({ queryKey: ['financeSummary'], queryFn: getFinanceSummary })

  const net = data?.net ?? 0
  const income = data?.income ?? 0
  const expenses = data?.expenses ?? 0

  return (
    <div>
      {/* Hero: Net figure — centered on mobile, offset on desktop for asymmetry */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 70, damping: 18, mass: 1.2 }}
        className="mb-12 text-center sm:mb-16 md:text-left lg:pl-8"
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

      {/* Whisper stats: wrap on mobile, float with space on desktop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-6 sm:gap-10 md:justify-end lg:gap-14"
      >
        <WhisperStat
          label="Income"
          value={formatCurrency(income)}
          icon={TrendingUp}
          accent="text-secondary"
          subtext="Month to date"
        />
        <WhisperStat
          label="Expenses"
          value={formatCurrency(expenses)}
          icon={TrendingDown}
          accent="text-tertiary"
          subtext="Month to date"
        />
      </motion.div>
    </div>
  )
}
