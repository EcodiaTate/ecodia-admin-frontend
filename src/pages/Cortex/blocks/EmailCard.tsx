import { motion } from 'framer-motion'
import { Mail } from 'lucide-react'
import { formatRelative } from '@/lib/utils'
import type { EmailCardBlock } from '@/types/cortex'

const PRIORITY_DOT = {
  urgent: 'bg-error',
  high: 'bg-tertiary',
  normal: 'bg-primary/40',
  low: 'bg-surface-container',
}

export function EmailCard({ block }: { block: EmailCardBlock }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-start gap-3.5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/8">
          <Mail className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[block.priority as keyof typeof PRIORITY_DOT] || PRIORITY_DOT.normal}`} />
            <span className="text-xs font-medium text-on-surface truncate">{block.from}</span>
            {block.receivedAt && (
              <span className="ml-auto text-label-sm text-on-surface-muted/50 flex-shrink-0">
                {formatRelative(block.receivedAt)}
              </span>
            )}
          </div>
          <p className="text-sm text-on-surface-variant truncate">{block.subject}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-on-surface-muted">{block.summary}</p>
        </div>
      </div>
    </motion.div>
  )
}
