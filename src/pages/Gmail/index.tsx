import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { syncGmail } from '@/api/gmail'
import { EmailList } from './EmailList'
import { EmailDetail } from './EmailDetail'
import { DraftReview } from './DraftReview'
import type { EmailThread } from '@/types/gmail'
import toast from 'react-hot-toast'
import { RefreshCw } from 'lucide-react'

export default function GmailPage() {
  const [selected, setSelected] = useState<EmailThread | null>(null)
  const queryClient = useQueryClient()

  const sync = useMutation({
    mutationFn: syncGmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmailThreads'] })
      toast.success('Gmail synced')
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">Gmail</h1>
        <button
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          className="flex items-center gap-2 rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${sync.isPending ? 'animate-spin' : ''}`} />
          Sync
        </button>
      </div>

      {selected ? (
        <div>
          <button onClick={() => setSelected(null)} className="mb-4 text-sm text-zinc-400 hover:text-zinc-200">
            &larr; Back to inbox
          </button>
          <EmailDetail thread={selected} />
          <DraftReview thread={selected} />
        </div>
      ) : (
        <EmailList onSelect={setSelected} />
      )}
    </div>
  )
}
