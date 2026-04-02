import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WhisperStatProps {
  label: string
  value: string | number
  icon?: LucideIcon
  accent?: string
  trend?: { value: number; label: string }
  subtext?: string
  onClick?: () => void
}

export function WhisperStat({ label, value, icon: Icon, accent = 'text-on-surface', trend, subtext, onClick }: WhisperStatProps) {
  return (
    <motion.div
      onClick={onClick}
      className={cn(
        'relative rounded-2xl px-4 py-3',
        onClick && 'cursor-pointer hover:bg-white/30',
      )}
    >
      <span className="block text-label-sm uppercase tracking-[0.08em] text-on-surface-muted/60">
        {label}
      </span>

      <p className={cn(
        'mt-1 font-display text-lg font-light tabular-nums',
        accent,
      )}>
        {value}
      </p>

      {trend && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {trend.value > 0 && <TrendingUp className="h-3 w-3 text-secondary" strokeWidth={1.75} />}
          {trend.value < 0 && <TrendingDown className="h-3 w-3 text-error" strokeWidth={1.75} />}
          <span className={cn(
            'text-label-sm',
            trend.value > 0 ? 'text-secondary' : trend.value < 0 ? 'text-error' : 'text-on-surface-muted',
          )}>
            {trend.value > 0 ? '+' : ''}{trend.value} {trend.label}
          </span>
        </div>
      )}
      {subtext && (
        <span className="mt-0.5 block text-label-sm text-on-surface-muted/40">{subtext}</span>
      )}

      {Icon && (
        <div className="absolute right-3 top-3 opacity-15">
          <Icon className={cn('h-4 w-4', accent)} strokeWidth={1.5} />
        </div>
      )}
    </motion.div>
  )
}
