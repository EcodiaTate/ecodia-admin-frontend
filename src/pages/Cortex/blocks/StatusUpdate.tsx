import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import type { StatusUpdateBlock } from '@/types/cortex'

export function StatusUpdate({ block }: { block: StatusUpdateBlock }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2.5 py-1"
    >
      <Activity className="h-3 w-3 text-secondary/60" strokeWidth={1.75} />
      <span className="text-xs text-on-surface-muted">
        {block.message}
        {block.count !== null && block.count !== undefined && (
          <span className="ml-1 font-mono text-primary/60">{block.count}</span>
        )}
      </span>
    </motion.div>
  )
}
