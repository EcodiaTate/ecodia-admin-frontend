/**
 * EnergyWhisper
 *
 * Ambient display of Claude Max weekly energy level.
 * Stays invisible until hovered — then expands to show full budget state.
 * The OS can budget its model selection from this data.
 */
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { getEnergy, type EnergySnapshot } from '@/api/osSession'
import { Zap } from 'lucide-react'

const LEVEL_COLOR: Record<EnergySnapshot['level'], string> = {
  full:     'bg-secondary',
  healthy:  'bg-secondary',
  conserve: 'bg-tertiary',
  low:      'bg-tertiary/70',
  critical: 'bg-error/70',
}

const LEVEL_TEXT: Record<EnergySnapshot['level'], string> = {
  full:     'text-secondary/60',
  healthy:  'text-secondary/50',
  conserve: 'text-tertiary/60',
  low:      'text-tertiary/70',
  critical: 'text-error/70',
}

export function EnergyWhisper({ className = '' }: { className?: string }) {
  const [expanded, setExpanded] = useState(false)

  const { data: energy } = useQuery({
    queryKey: ['claudeEnergy'],
    queryFn: getEnergy,
    refetchInterval: 120_000,
    staleTime: 60_000,
  })

  if (!energy) return null

  const pctRemaining = energy.pctRemaining
  const barWidth = Math.max(2, pctRemaining)
  const colorClass = LEVEL_COLOR[energy.level]
  const textClass  = LEVEL_TEXT[energy.level]

  return (
    <motion.div
      className={`relative flex items-center gap-2 cursor-default select-none ${className}`}
      onHoverStart={() => setExpanded(true)}
      onHoverEnd={() => setExpanded(false)}
    >
      {/* Zap icon — whisper size */}
      <Zap className={`h-2.5 w-2.5 ${textClass}`} strokeWidth={1.5} />

      {/* Energy bar */}
      <div className="h-px w-12 bg-on-surface-muted/10 overflow-hidden rounded-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          className={`h-full rounded-full ${colorClass}/40`}
        />
      </div>

      {/* Percentage whisper */}
      <span className={`font-mono text-[10px] ${textClass}`}>
        {Math.round(pctRemaining)}%
      </span>

      {/* Expanded tooltip on hover */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            className="absolute bottom-full left-0 mb-3 z-50 min-w-[220px]"
          >
            <div
              className="rounded-2xl px-4 py-3"
              style={{
                background: 'rgba(255,255,255,0.88)',
                border: '1px solid rgba(255,255,255,0.7)',
                boxShadow: '0 20px 50px -12px rgba(0,104,122,0.06)',
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <Zap className={`h-3 w-3 ${textClass}`} strokeWidth={1.5} />
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-on-surface-muted/50">
                  Claude Energy — Week {energy.weekStart}
                </span>
              </div>

              {/* Full bar */}
              <div className="h-1 w-full bg-on-surface-muted/10 rounded-full overflow-hidden mb-3">
                <motion.div
                  animate={{ width: `${barWidth}%` }}
                  transition={{ type: 'spring', stiffness: 60, damping: 20 }}
                  className={`h-full rounded-full ${colorClass}/50`}
                />
              </div>

              {/* Stats */}
              <div className="space-y-1">
                <Row label="Remaining" value={`${Math.round(pctRemaining)}%`} highlight={textClass} />
                <Row label="Used" value={`${Math.round(energy.pctUsed)}%`} />
                <Row label="Turns this week" value={String(energy.turns)} />
                {energy.avgDailyBurn > 0 && (
                  <Row label="Burn rate" value={`~${Math.round(energy.avgDailyBurn / 1000)}K tokens/day`} />
                )}
                {energy.projectedPctUsed > 0 && (
                  <Row label="Projected end-of-week" value={`${Math.round(energy.projectedPctUsed)}% used`} />
                )}
                {energy.daysUntilExhaustion != null && energy.daysUntilExhaustion < 5 && (
                  <Row label="Exhaustion in" value={`${energy.daysUntilExhaustion.toFixed(1)} days`} highlight="text-error/70" />
                )}
                <Row label="Resets in" value={`${Math.round(energy.hoursUntilReset)}h`} />
                <Row label="Recommended model" value={energy.modelRec} highlight={textClass} />
              </div>

              {/* Energy level label */}
              <div className={`mt-2 pt-2 border-t border-on-surface-muted/10 font-mono text-[9px] uppercase tracking-[0.2em] ${textClass}`}>
                {energy.label}
                {energy.scheduleMultiplier < 1 && ` · scheduling at ${energy.scheduleMultiplier}×`}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="font-mono text-[10px] text-on-surface-muted/40">{label}</span>
      <span className={`font-mono text-[10px] tabular-nums ${highlight || 'text-on-surface/60'}`}>{value}</span>
    </div>
  )
}
