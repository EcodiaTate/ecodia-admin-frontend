import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getScheduledPosts, schedulePost } from '@/api/linkedin'
import toast from 'react-hot-toast'

export function PostScheduler() {
  const [content, setContent] = useState('')
  const queryClient = useQueryClient()

  const { data: posts } = useQuery({ queryKey: ['linkedinPosts'], queryFn: getScheduledPosts })

  const create = useMutation({
    mutationFn: () => schedulePost(content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedinPosts'] })
      setContent('')
      toast.success('Post saved as draft')
    },
  })

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-zinc-400">Schedule Post</h2>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your LinkedIn post..."
        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
        rows={4}
      />
      <button
        onClick={() => create.mutate()}
        disabled={!content.trim() || create.isPending}
        className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
      >
        Save Draft
      </button>

      {(posts as unknown[])?.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-zinc-400">Drafts & Scheduled</h3>
          {(posts as Array<Record<string, unknown>>).map((p) => (
            <div key={p.id as string} className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3">
              <p className="text-sm text-zinc-300">{(p.content as string).slice(0, 100)}...</p>
              <p className="mt-1 text-xs text-zinc-500">{p.status as string}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
