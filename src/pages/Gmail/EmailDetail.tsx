import DOMPurify from 'dompurify'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { archiveThread, markRead, trashThread, triageThread } from '@/api/gmail'
import type { EmailThread } from '@/types/gmail'
import { StatusBadge } from '@/components/shared/StatusBadge'
import toast from 'react-hot-toast'
import { Archive, Trash2, Eye, Sparkles } from 'lucide-react'
import { GlassPanel } from '@/components/spatial/GlassPanel'

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

  // Sanitize HTML email body to prevent XSS — DOMPurify strips all dangerous content
  const sanitizedBody = thread.full_body ? DOMPurify.sanitize(thread.full_body) : ''
  const isHtml = thread.full_body ? thread.full_body.includes('<') : false

  return (
    <GlassPanel depth="elevated" className="p-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-headline-md font-light text-on-surface">
            {thread.subject || '(no subject)'}
          </h2>
          <div className="mt-2 flex items-center gap-3 text-sm text-on-surface-muted">
            <span className="text-on-surface-variant">{thread.from_name || thread.from_email}</span>
            {thread.inbox && (
              <span className="rounded-xl bg-surface-container px-2 py-0.5 text-label-sm">
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
        <div className="mt-8 rounded-2xl bg-primary/5 p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
            <span className="text-label-md uppercase tracking-[0.05em] text-primary">Neural Triage</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{thread.triage_summary}</p>
          {thread.triage_action && (
            <p className="mt-2 text-label-sm text-on-surface-muted">Suggested: {thread.triage_action}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-2">
        {thread.status === 'unread' && (
          <button onClick={() => read.mutate()} className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container">
            <Eye className="h-3.5 w-3.5" strokeWidth={1.75} /> Mark read
          </button>
        )}
        <button onClick={() => archive.mutate()} className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container">
          <Archive className="h-3.5 w-3.5" strokeWidth={1.75} /> Archive
        </button>
        <button onClick={() => trash.mutate()} className="flex items-center gap-2 rounded-xl bg-error/5 px-4 py-2.5 text-sm text-error transition-colors hover:bg-error/10">
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} /> Trash
        </button>
        {thread.triage_status !== 'complete' && (
          <button onClick={() => triage.mutate()} disabled={triage.isPending} className="btn-primary-gradient flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-40">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} /> {triage.isPending ? 'Triaging...' : 'AI Triage'}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="mt-10">
        {isHtml ? (
          <div
            className="prose prose-sm max-w-none text-on-surface-variant prose-headings:text-on-surface prose-a:text-primary-container [&_img]:max-w-full"
            dangerouslySetInnerHTML={{ __html: sanitizedBody }}
          />
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">
            {thread.full_body || thread.snippet || 'No content'}
          </p>
        )}
      </div>
    </GlassPanel>
  )
}
