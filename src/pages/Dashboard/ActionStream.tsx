import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPendingActions, executeAction, dismissAction } from '@/api/actions'
import type { ActionItem } from '@/api/actions'
import { motion, AnimatePresence } from 'framer-motion'
import { formatRelative } from '@/lib/utils'
import { Check, X, Loader2 } from 'lucide-react'
import { useState } from 'react'

// ─── The system's voice ───────────────────────────────────────────────
//
// These are decisions the AI has already made. It's not asking you to
// manage anything — it's telling you what it wants to do, and waiting
// for a nod or a shake. One gesture. That's all.
//
// No icons. No labels. No priority badges.
// Just the action, the context, and two gestures.

const URGENCY_LINE: Record<string, string> = {
  urgent: 'bg-error/60',
  high: 'bg-tertiary/40',
  medium: 'bg-primary/20',
  low: 'bg-on-surface-muted/10',
}

export function ActionStream() {
  const queryClient = useQueryClient()

  const { data: actions } = useQuery({
    queryKey: ['pendingActions'],
    queryFn: () => getPendingActions(6),
    refetchInterval: 20000,
  })

  if (!actions || actions.length === 0) return null

  return (
    <div className="space-y-px">
      <AnimatePresence initial={false}>
        {actions.map((action, i) => (
          <ActionVoice key={action.id} action={action} index={i} queryClient={queryClient} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ActionVoice({
  action,
  index,
  queryClient,
}: {
  action: ActionItem
  index: number
  queryClient: ReturnType<typeof useQueryClient>
}) {
  const [executing, setExecuting] = useState(false)

  const draft = action.prepared_data?.draft as string | undefined

  const execute = useMutation({
    mutationFn: () => executeAction(action.id),
    onMutate: () => setExecuting(true),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['pendingActions'] }),
  })

  const dismiss = useMutation({
    mutationFn: () => dismissAction(action.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pendingActions'] }),
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        x: 40,
        transition: { type: 'spring', stiffness: 300, damping: 28 },
      }}
      transition={{ type: 'spring', stiffness: 100, damping: 22, delay: index * 0.04 }}
      className="group relative rounded-2xl px-5 py-4 hover:bg-white/30 transition-colors"
    >
      {/* Urgency thread — a thin left line, not a badge */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${URGENCY_LINE[action.priority] ?? URGENCY_LINE.medium}`} />

      <div className="pl-3">
        {/* The decision — stated plainly, no UI chrome */}
        <p className="text-sm leading-snug text-on-surface">
          {action.title}
        </p>

        {/* Draft preview — what the system actually wrote */}
        {draft && (
          <p className="mt-1.5 text-xs italic leading-relaxed text-on-surface-muted/50 line-clamp-2">
            &ldquo;{draft.slice(0, 140)}{draft.length > 140 ? '…' : ''}&rdquo;
          </p>
        )}

        {/* Whisper metadata */}
        <p className="mt-1.5 font-mono text-[10px] text-on-surface-muted/25">
          {action.source} · {formatRelative(action.created_at)}
        </p>
      </div>

      {/* Gestures — appear on hover, invisible at rest */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {executing ? (
          <div className="flex h-7 w-7 items-center justify-center">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary/50" />
          </div>
        ) : (
          <>
            <button
              onClick={() => dismiss.mutate()}
              disabled={dismiss.isPending}
              className="flex h-7 w-7 items-center justify-center rounded-xl text-on-surface-muted/30 hover:bg-surface-container hover:text-on-surface-muted transition-colors"
            >
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
            <button
              onClick={() => execute.mutate()}
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}
