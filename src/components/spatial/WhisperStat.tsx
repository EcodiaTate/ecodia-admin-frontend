import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

const spring = { type: 'spring' as const, stiffness: 280, damping: 22 }

export function WhisperStat({ label, value, icon: Icon, accent = 'text-on-surface', trend, subtext, onClick }: WhisperStatProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      layout
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      className={cn(
        'relative rounded-2xl transition-colors',
        onClick && 'cursor-pointer',
        hovered ? 'bg-white/40 px-6 py-5' : 'px-3 py-2',
      )}
      transition={spring}
    >
      {/* Label */}
      <motion.span
        layout="position"
        className={cn(
          'block text-label-sm uppercase tracking-[0.08em]',
          hovered ? 'text-on-surface-muted/70 mb-2' : 'text-on-surface-muted/40',
        )}
        transition={spring}
      >
        {label}
      </motion.span>

      {/* Value */}
      <motion.span
        layout="position"
        className={cn(
          'block font-display font-light tabular-nums',
          hovered ? `text-[2rem] ${accent}` : `text-sm text-on-surface-muted/60`,
        )}
        transition={spring}
      >
        {value}
      </motion.span>

      {/* Expanded details */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ ...spring, delay: 0.05 }}
            className="mt-2 space-y-1"
          >
            {trend && (
              <div className="flex items-center gap-1.5">
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
              <span className="block text-label-sm text-on-surface-muted/50">{subtext}</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon floats to the right when expanded */}
      <AnimatePresence>
        {hovered && Icon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.3, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={spring}
            className="absolute right-5 top-5"
          >
            <Icon className={cn('h-5 w-5', accent)} strokeWidth={1.5} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
