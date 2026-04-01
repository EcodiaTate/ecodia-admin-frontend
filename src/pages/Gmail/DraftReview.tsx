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
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
      <h3 className="text-sm font-medium text-zinc-400">Reply</h3>

      {thread.draft_reply ? (
        <div className="mt-3">
          <div className="rounded-md border border-zinc-700/50 bg-zinc-800/50 p-4">
            <p className="whitespace-pre-wrap text-sm text-zinc-300">{thread.draft_reply}</p>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => send.mutate()}
              disabled={send.isPending}
              className="flex items-center gap-1.5 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              {send.isPending ? 'Sending...' : `Send from ${thread.inbox || 'code@ecodia.au'}`}
            </button>
            <button
              onClick={() => draft.mutate()}
              disabled={draft.isPending}
              className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Regenerate
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => draft.mutate()}
          disabled={draft.isPending}
          className="mt-3 flex items-center gap-1.5 rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {draft.isPending ? 'Generating...' : 'Generate AI Draft Reply'}
        </button>
      )}
    </div>
  )
}
