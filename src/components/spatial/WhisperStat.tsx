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

// Slow, syrupy, glass-like motion — not snappy
const glide = { type: 'spring' as const, stiffness: 90, damping: 20, mass: 1 }
const fadeGlide = { type: 'spring' as const, stiffness: 80, damping: 22, mass: 0.8 }

export function WhisperStat({ label, value, icon: Icon, accent = 'text-on-surface', trend, subtext, onClick }: WhisperStatProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      animate={{
        backgroundColor: hovered ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0)',
      }}
      transition={glide}
      className={cn(
        'relative rounded-2xl px-5 py-4',
        onClick && 'cursor-pointer',
      )}
    >
      {/* Label */}
      <motion.span
        animate={{
          opacity: hovered ? 0.7 : 0.4,
        }}
        transition={glide}
        className="block text-label-sm uppercase tracking-[0.08em] text-on-surface-muted"
      >
        {label}
      </motion.span>

      {/* Value — animates font size via scale transform to avoid layout shift */}
      <motion.span
        animate={{
          scale: hovered ? 1.8 : 1,
          opacity: hovered ? 1 : 0.6,
        }}
        transition={glide}
        style={{ transformOrigin: 'left bottom' }}
        className={cn(
          'mt-1 block font-display text-sm font-light tabular-nums',
          hovered ? accent : 'text-on-surface-muted',
        )}
      >
        {value}
      </motion.span>

      {/* Expanded details — fade in slowly below */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={fadeGlide}
            className="mt-6 space-y-1 overflow-hidden"
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

      {/* Icon drifts in when expanded */}
      <AnimatePresence>
        {hovered && Icon && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 0.25, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={fadeGlide}
            className="absolute right-5 top-4"
          >
            <Icon className={cn('h-5 w-5', accent)} strokeWidth={1.5} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
