import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPendingActions, executeAction, dismissAction } from '@/api/actions'
import type { ActionItem } from '@/api/actions'
import { motion, AnimatePresence } from 'framer-motion'
import { formatRelative } from '@/lib/utils'
import { Check, X, Mail, Linkedin, Share2, Calendar, FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

const SOURCE_ICON: Record<string, typeof Mail> = {
  gmail: Mail,
  linkedin: Linkedin,
  meta: Share2,
  calendar: Calendar,
  factory: FileText,
}

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-error',
  high: 'bg-tertiary',
  medium: 'bg-primary/40',
  low: 'bg-on-surface-muted/20',
}

const ACTION_LABELS: Record<string, string> = {
  send_reply: 'Send reply',
  send_linkedin_reply: 'Send reply',
  send_meta_message: 'Send reply',
  create_lead: 'Create lead',
  follow_up: 'Follow up',
  publish_post: 'Publish',
  schedule_meeting: 'Schedule',
  create_task: 'Create task',
  create_doc: 'Create doc',
  archive_email: 'Archive',
  reply_to_comment: 'Reply',
}

export function ActionStream() {
  const queryClient = useQueryClient()

  const { data: actions } = useQuery({
    queryKey: ['pendingActions'],
    queryFn: () => getPendingActions(8),
    refetchInterval: 30000,
  })

  if (!actions || actions.length === 0) return null

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">
          Pending Actions
        </span>
        <span className="text-label-sm text-on-surface-muted/40">{actions.length} items</span>
      </div>

      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {actions.map((action, i) => (
            <ActionCard key={action.id} action={action} index={i} queryClient={queryClient} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ActionCard({ action, index, queryClient }: { action: ActionItem; index: number; queryClient: ReturnType<typeof useQueryClient> }) {
  const [executing, setExecuting] = useState(false)

  const Icon = SOURCE_ICON[action.source] || FileText
  const label = ACTION_LABELS[action.action_type] || action.action_type.replace(/_/g, ' ')
  const draft = action.prepared_data?.draft as string | undefined

  const executeMut = useMutation({
    mutationFn: () => executeAction(action.id),
    onMutate: () => setExecuting(true),
    onSuccess: (data) => {
      toast.success((data as { message?: string })?.message || 'Done')
      queryClient.invalidateQueries({ queryKey: ['pendingActions'] })
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed')
      setExecuting(false)
    },
  })

  const dismissMut = useMutation({
    mutationFn: () => dismissAction(action.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pendingActions'] }),
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 100, damping: 22, delay: index * 0.03 }}
      className="group rounded-2xl bg-white/40 px-4 py-3 transition-colors hover:bg-white/55"
    >
      <div className="flex items-start gap-3">
        {/* Source icon + priority dot */}
        <div className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-container-low/60">
          <Icon className="h-3.5 w-3.5 text-on-surface-muted" strokeWidth={1.75} />
          <div className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${PRIORITY_DOT[action.priority]}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface truncate">{action.title}</p>
          {action.summary && (
            <p className="mt-0.5 text-xs text-on-surface-muted line-clamp-1">{action.summary}</p>
          )}
          {draft && (
            <p className="mt-1 text-xs text-on-surface-variant/70 italic line-clamp-2">&ldquo;{draft.slice(0, 120)}{draft.length > 120 ? '...' : ''}&rdquo;</p>
          )}
          <div className="mt-1.5 flex items-center gap-2">
            <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">{label}</span>
            <span className="text-[10px] text-on-surface-muted/30 font-mono">{formatRelative(action.created_at)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
          {executing ? (
            <div className="flex h-8 w-8 items-center justify-center">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <button
                onClick={() => dismissMut.mutate()}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-muted/40 transition-colors hover:bg-surface-container hover:text-on-surface-muted"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
              <button
                onClick={() => executeMut.mutate()}
                className="flex h-8 items-center gap-1 rounded-xl bg-primary/10 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
              >
                <Check className="h-3 w-3" strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
