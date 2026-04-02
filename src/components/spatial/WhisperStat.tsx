import { useState } from 'react'
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

// Slow, viscous — like glass settling into shape
const glide = { type: 'spring' as const, stiffness: 70, damping: 18, mass: 1.2 }

export function WhisperStat({ label, value, icon: Icon, accent = 'text-on-surface', trend, subtext, onClick }: WhisperStatProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      // The WHOLE pane transforms as one — position, size, surface all together
      animate={{
        padding: hovered ? '28px 32px' : '10px 14px',
        backgroundColor: hovered
          ? 'rgba(255, 255, 255, 0.50)'
          : 'rgba(255, 255, 255, 0)',
        boxShadow: hovered
          ? '0 24px 60px -16px rgba(0, 104, 122, 0.06)'
          : '0 0px 0px 0px rgba(0, 104, 122, 0)',
        borderColor: hovered
          ? 'rgba(255, 255, 255, 0.6)'
          : 'rgba(255, 255, 255, 0)',
      }}
      transition={glide}
      style={{ borderWidth: 1, borderStyle: 'solid' }}
      className={cn(
        'relative rounded-3xl',
        onClick && 'cursor-pointer',
      )}
    >
      {/* Label — drifts from muted to visible */}
      <motion.span
        animate={{ opacity: hovered ? 0.8 : 0.35 }}
        transition={glide}
        className="block text-label-sm uppercase tracking-[0.08em] text-on-surface-muted"
      >
        {label}
      </motion.span>

      {/* Value — the whole text element scales up as one with the pane */}
      <motion.p
        animate={{
          fontSize: hovered ? '2rem' : '0.875rem',
          lineHeight: hovered ? '2.5rem' : '1.25rem',
          marginTop: hovered ? '8px' : '2px',
          opacity: hovered ? 1 : 0.5,
          color: hovered ? undefined : undefined,
        }}
        transition={glide}
        className={cn(
          'font-display font-light tabular-nums',
          hovered ? accent : 'text-on-surface-muted',
        )}
      >
        {value}
      </motion.p>

      {/* Contextual detail — grows from 0 height as part of the pane expansion */}
      <motion.div
        animate={{
          height: hovered ? 'auto' : 0,
          opacity: hovered ? 1 : 0,
          marginTop: hovered ? 12 : 0,
        }}
        transition={{ ...glide, opacity: { ...glide, delay: hovered ? 0.15 : 0 } }}
        className="overflow-hidden"
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
          <span className="mt-1 block text-label-sm text-on-surface-muted/50">{subtext}</span>
        )}
      </motion.div>

      {/* Icon — materializes in the corner as the glass grows */}
      <motion.div
        animate={{
          opacity: hovered ? 0.2 : 0,
          scale: hovered ? 1 : 0.7,
        }}
        transition={glide}
        className="absolute right-6 top-6"
      >
        {Icon && <Icon className={cn('h-5 w-5', accent)} strokeWidth={1.5} />}
      </motion.div>
    </motion.div>
  )
}
