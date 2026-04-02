import { useState } from 'react'
import { motion } from 'framer-motion'
import { CircleDot, Check, X } from 'lucide-react'
import { executeCortexAction } from '@/api/cortex'
import type { TaskCardBlock } from '@/types/cortex'

const PRIORITY_COLORS = {
  urgent: 'text-error',
  high: 'text-tertiary',
  medium: 'text-primary',
  low: 'text-on-surface-muted',
}

export function TaskCard({ block }: { block: TaskCardBlock }) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'dismissed'>('idle')

  async function handleSave() {
    setState('saving')
    try {
      await executeCortexAction('create_task', {
        title: block.title,
        description: block.description,
        priority: block.priority,
      })
      setState('saved')
    } catch {
      setState('idle')
    }
  }

  if (state === 'dismissed') return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-start gap-3.5">
        <div className={`mt-0.5 flex-shrink-0 ${PRIORITY_COLORS[block.priority]}`}>
          <CircleDot className="h-4 w-4" strokeWidth={1.75} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface">{block.title}</p>
          {block.description && (
            <p className="mt-1 text-xs leading-relaxed text-on-surface-muted">{block.description}</p>
          )}
          <span className="mt-2 inline-block text-label-sm uppercase tracking-wide text-on-surface-muted/50">
            {block.priority} priority
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {state === 'saved' ? (
            <span className="flex items-center gap-1.5 text-xs text-secondary">
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              Saved
            </span>
          ) : state === 'saving' ? (
            <span className="text-xs text-on-surface-muted">Saving...</span>
          ) : (
            <>
              <button
                onClick={() => setState('dismissed')}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-on-surface-muted/40 transition-colors hover:bg-surface-container hover:text-on-surface-muted"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
              <button
                onClick={handleSave}
                className="flex h-7 items-center gap-1 rounded-lg bg-primary/10 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
