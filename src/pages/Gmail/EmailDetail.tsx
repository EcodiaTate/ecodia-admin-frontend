import DOMPurify from 'dompurify'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { archiveThread, markRead, trashThread, triageThread } from '@/api/gmail'
import type { EmailThread } from '@/types/gmail'
import { StatusBadge } from '@/components/shared/StatusBadge'
import toast from 'react-hot-toast'
import { Archive, Trash2, Eye, Sparkles } from 'lucide-react'

interface EmailDetailProps {
  thread: EmailThread
  onUpdate: (thread: EmailThread) => void
}

export function EmailDetail({ thread, onUpdate }: EmailDetailProps) {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['gmailThreads'] })
    queryClient.invalidateQueries({ queryKey: ['gmailStats'] })
  }

  const archive = useMutation({
    mutationFn: () => archiveThread(thread.id),
    onSuccess: () => { invalidate(); toast.success('Archived') },
  })

  const trash = useMutation({
    mutationFn: () => trashThread(thread.id),
    onSuccess: () => { invalidate(); toast.success('Trashed') },
  })

  const read = useMutation({
    mutationFn: () => markRead(thread.id),
    onSuccess: () => { invalidate(); toast.success('Marked read') },
  })

  const triage = useMutation({
    mutationFn: () => triageThread(thread.id),
    onSuccess: (data) => { invalidate(); onUpdate(data); toast.success('Triaged') },
    onError: () => toast.error('Triage failed'),
  })

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-medium text-zinc-100">{thread.subject || '(no subject)'}</h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
            <span>{thread.from_name || thread.from_email}</span>
            {thread.inbox && (
              <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-500">
                to {thread.inbox}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={thread.triage_priority} />
          <StatusBadge status={thread.status} />
        </div>
      </div>

      {/* AI Triage */}
      {thread.triage_summary && (
        <div className="mt-4 rounded-md border border-zinc-700/50 bg-zinc-800/50 p-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span className="text-xs font-medium text-purple-400">AI Triage</span>
          </div>
          <p className="mt-1 text-sm text-zinc-300">{thread.triage_summary}</p>
          {thread.triage_action && (
            <p className="mt-1 text-xs text-zinc-500">Suggested: {thread.triage_action}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {thread.status === 'unread' && (
          <button onClick={() => read.mutate()} className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700">
            <Eye className="h-3.5 w-3.5" /> Mark read
          </button>
        )}
        <button onClick={() => archive.mutate()} className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700">
          <Archive className="h-3.5 w-3.5" /> Archive
        </button>
        <button onClick={() => trash.mutate()} className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-red-400 hover:bg-zinc-700">
          <Trash2 className="h-3.5 w-3.5" /> Trash
        </button>
        {thread.triage_status !== 'complete' && (
          <button onClick={() => triage.mutate()} disabled={triage.isPending} className="flex items-center gap-1.5 rounded-md bg-purple-600/20 px-3 py-1.5 text-sm text-purple-400 hover:bg-purple-600/30 disabled:opacity-50">
            <Sparkles className="h-3.5 w-3.5" /> {triage.isPending ? 'Triaging...' : 'AI Triage'}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="mt-4">
        {thread.full_body && thread.full_body.includes('<') ? (
          <div
            className="prose prose-invert prose-sm max-w-none text-zinc-300 [&_a]:text-blue-400 [&_img]:max-w-full"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(thread.full_body) }}
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm text-zinc-300">
            {thread.full_body || thread.snippet || 'No content'}
          </p>
        )}
      </div>
    </div>
  )
}
