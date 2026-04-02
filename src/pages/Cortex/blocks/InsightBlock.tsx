import { motion } from 'framer-motion'
import { Lightbulb } from 'lucide-react'
import type { InsightBlock as InsightBlockType } from '@/types/cortex'

const URGENCY_BG = {
  low: 'bg-primary/4',
  medium: 'bg-tertiary/6',
  high: 'bg-error/6',
}

const URGENCY_ICON = {
  low: 'text-primary/50',
  medium: 'text-tertiary/70',
  high: 'text-error/70',
}

export function InsightBlock({ block }: { block: InsightBlockType }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      className={`flex items-start gap-3 rounded-2xl px-5 py-4 ${URGENCY_BG[block.urgency]}`}
    >
      <Lightbulb className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${URGENCY_ICON[block.urgency]}`} strokeWidth={1.75} />
      <p className="text-xs leading-relaxed text-on-surface-variant">{block.message}</p>
    </motion.div>
  )
}
