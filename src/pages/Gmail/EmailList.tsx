import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getThreads, archiveThread, markRead } from '@/api/gmail'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatRelative } from '@/lib/utils'
import { Archive, Eye } from 'lucide-react'
import type { EmailThread } from '@/types/gmail'

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
    <div className="space-y-1">
      {threads.map((thread) => (
        <div
          key={thread.id}
          className="group flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-3 transition-colors hover:bg-zinc-800/50"
        >
          {/* Priority indicator */}
          <div className="mt-1 flex-shrink-0">
            <StatusBadge status={thread.triage_priority} />
          </div>

          {/* Main content — clickable */}
          <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onSelect(thread)}>
            <div className="flex items-center gap-2">
              {thread.status === 'unread' && (
                <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" />
              )}
              <span className={`text-sm font-medium ${thread.status === 'unread' ? 'text-zinc-100' : 'text-zinc-400'}`}>
                {thread.from_name || thread.from_email}
              </span>
              {thread.inbox && (
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                  {thread.inbox.split('@')[0]}@
                </span>
              )}
              <span className="ml-auto flex-shrink-0 text-xs text-zinc-600">
                {thread.received_at ? formatRelative(thread.received_at) : ''}
              </span>
            </div>
            <p className={`mt-0.5 text-sm ${thread.status === 'unread' ? 'text-zinc-200' : 'text-zinc-400'}`}>
              {thread.subject || '(no subject)'}
            </p>
            {thread.triage_summary ? (
              <p className="mt-0.5 text-xs text-zinc-500">{thread.triage_summary}</p>
            ) : thread.snippet ? (
              <p className="mt-0.5 truncate text-xs text-zinc-600">{thread.snippet}</p>
            ) : null}
            {thread.triage_action && (
              <span className="mt-1 inline-block rounded bg-zinc-800/80 px-1.5 py-0.5 text-[10px] text-zinc-500">
                {thread.triage_action}
              </span>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex flex-shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            {thread.status === 'unread' && (
              <button
                onClick={(e) => { e.stopPropagation(); read.mutate(thread.id) }}
                className="rounded p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
                title="Mark read"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); archive.mutate(thread.id) }}
              className="rounded p-1.5 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300"
              title="Archive"
            >
              <Archive className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
      {threads.length === 0 && (
        <p className="py-8 text-center text-sm text-zinc-500">No emails match filters</p>
      )}
    </div>
  )
}
