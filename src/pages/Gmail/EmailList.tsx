import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getThreads, archiveThread, markRead } from '@/api/gmail'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatRelative } from '@/lib/utils'
import { Archive, Eye } from 'lucide-react'
import type { EmailThread } from '@/types/gmail'
import { motion } from 'framer-motion'

interface EmailListProps {
  status?: string
  priority?: string
  inbox?: string
  onSelect: (thread: EmailThread) => void
}

export function EmailList({ status, priority, inbox, onSelect }: EmailListProps) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['gmailThreads', status, priority, inbox],
    queryFn: () => getThreads({ status, priority, inbox, limit: 30 }),
  })

  const archive = useMutation({
    mutationFn: archiveThread,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmailThreads'] })
      queryClient.invalidateQueries({ queryKey: ['gmailStats'] })
    },
  })

  const read = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmailThreads'] })
      queryClient.invalidateQueries({ queryKey: ['gmailStats'] })
    },
  })

  if (isLoading) return <LoadingSpinner />

  const threads = data?.threads ?? []

  return (
    <div className="space-y-2">
      {threads.map((thread, i) => (
        <motion.div
          key={thread.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.04 }}
          className="group flex items-start gap-4 rounded-2xl px-5 py-4 transition-colors hover:bg-surface-container-low/60"
        >
          {/* Priority indicator */}
          <div className="mt-0.5 flex-shrink-0">
            <StatusBadge status={thread.triage_priority} />
          </div>

          {/* Main content */}
          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onSelect(thread)}>
            <div className="flex items-center gap-2">
              {thread.status === 'unread' && (
                <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary-container" />
              )}
              <span className={`text-sm font-medium ${thread.status === 'unread' ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                {thread.from_name || thread.from_email}
              </span>
              {thread.inbox && (
                <span className="rounded-lg bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-muted">
                  {thread.inbox.split('@')[0]}@
                </span>
              )}
              <span className="ml-auto flex-shrink-0 font-mono text-label-sm text-on-surface-muted">
                {thread.received_at ? formatRelative(thread.received_at) : ''}
              </span>
            </div>
            <p className={`mt-1 text-sm ${thread.status === 'unread' ? 'text-on-surface' : 'text-on-surface-variant'}`}>
              {thread.subject || '(no subject)'}
            </p>
            {thread.triage_summary ? (
              <p className="mt-1 text-xs text-on-surface-muted">{thread.triage_summary}</p>
            ) : thread.snippet ? (
              <p className="mt-1 truncate text-xs text-on-surface-muted">{thread.snippet}</p>
            ) : null}
            {thread.triage_action && (
              <span className="mt-1.5 inline-block rounded-lg bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-muted">
                {thread.triage_action}
              </span>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex flex-shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {thread.status === 'unread' && (
              <button
                onClick={(e) => { e.stopPropagation(); read.mutate(thread.id) }}
                className="rounded-lg p-1.5 text-on-surface-muted transition-colors hover:bg-surface-container hover:text-on-surface-variant"
                title="Mark read"
              >
                <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); archive.mutate(thread.id) }}
              className="rounded-lg p-1.5 text-on-surface-muted transition-colors hover:bg-surface-container hover:text-on-surface-variant"
              title="Archive"
            >
              <Archive className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </motion.div>
      ))}
      {threads.length === 0 && (
        <p className="py-16 text-center text-sm text-on-surface-muted">
          No signals match current filters
        </p>
      )}
    </div>
  )
}
