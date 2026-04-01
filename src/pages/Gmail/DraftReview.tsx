import { useMutation, useQueryClient } from '@tanstack/react-query'
import { draftReply, sendDraft } from '@/api/gmail'
import type { EmailThread } from '@/types/gmail'
import toast from 'react-hot-toast'
import { Send, Sparkles } from 'lucide-react'

interface DraftReviewProps {
  thread: EmailThread
  onUpdate: (thread: EmailThread) => void
}

export function DraftReview({ thread, onUpdate }: DraftReviewProps) {
  const queryClient = useQueryClient()

  const draft = useMutation({
    mutationFn: () => draftReply(thread.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gmailThreads'] })
      onUpdate(data)
      toast.success('Draft generated')
    },
    onError: () => toast.error('Failed to generate draft'),
  })

  const send = useMutation({
    mutationFn: () => sendDraft(thread.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['gmailThreads'] })
      queryClient.invalidateQueries({ queryKey: ['gmailStats'] })
      onUpdate(data)
      toast.success('Reply sent')
    },
    onError: () => toast.error('Failed to send'),
  })

  return (
    <div className="glass rounded-3xl p-8">
      <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Compose Reply</h3>

      {thread.draft_reply ? (
        <div className="mt-6">
          <div className="rounded-2xl bg-surface-container-low p-6">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">{thread.draft_reply}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => send.mutate()}
              disabled={send.isPending}
              className="btn-primary-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
              {send.isPending ? 'Sending...' : `Send from ${thread.inbox || 'code@ecodia.au'}`}
            </button>
            <button
              onClick={() => draft.mutate()}
              disabled={draft.isPending}
              className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
              Regenerate
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => draft.mutate()}
          disabled={draft.isPending}
          className="mt-6 flex items-center gap-2 rounded-xl bg-surface-container-high px-5 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
        >
          <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
          {draft.isPending ? 'Generating...' : 'Generate AI Draft Reply'}
        </button>
      )}
    </div>
  )
}
