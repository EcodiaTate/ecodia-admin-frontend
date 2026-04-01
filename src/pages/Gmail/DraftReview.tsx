import { useMutation, useQueryClient } from '@tanstack/react-query'
import { draftReply, sendDraft } from '@/api/gmail'
import type { EmailThread } from '@/types/gmail'
import toast from 'react-hot-toast'

export function DraftReview({ thread }: { thread: EmailThread }) {
  const queryClient = useQueryClient()

  const draft = useMutation({
    mutationFn: () => draftReply(thread.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmailThreads'] })
      toast.success('Draft generated')
    },
  })

  const send = useMutation({
    mutationFn: () => sendDraft(thread.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmailThreads'] })
      toast.success('Reply sent')
    },
  })

  return (
    <div className="mt-4 space-y-3">
      {thread.draft_reply ? (
        <div className="rounded-md border border-zinc-700 bg-zinc-800/50 p-4">
          <p className="text-xs font-medium text-zinc-500">Draft Reply</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{thread.draft_reply}</p>
          <button
            onClick={() => send.mutate()}
            disabled={send.isPending}
            className="mt-3 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {send.isPending ? 'Sending...' : 'Send Reply'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => draft.mutate()}
          disabled={draft.isPending}
          className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
        >
          {draft.isPending ? 'Generating...' : 'Generate Draft Reply'}
        </button>
      )}
    </div>
  )
}
