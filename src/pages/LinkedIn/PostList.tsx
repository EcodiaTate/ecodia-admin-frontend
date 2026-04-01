import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPosts, deletePost } from '@/api/linkedin'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatRelative, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { LinkedInPost } from '@/types/linkedin'
import toast from 'react-hot-toast'
import { Plus, Trash2, Eye, BarChart3 } from 'lucide-react'

interface PostListProps {
  onCompose: () => void
}

const STATUS_TABS = [
  { label: 'All', value: undefined },
  { label: 'Drafts', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Posted', value: 'posted' },
  { label: 'Failed', value: 'failed' },
]

export function PostList({ onCompose }: PostListProps) {
  const [status, setStatus] = useState<string | undefined>()
  const queryClient = useQueryClient()

  const { data: posts, isLoading } = useQuery({
    queryKey: ['linkedinPosts', status],
    queryFn: () => getPosts({ status, limit: 30 }),
  })

  const remove = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linkedinPosts'] })
      toast.success('Post deleted')
    },
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t.label}
              onClick={() => setStatus(t.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                status === t.value ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={onCompose}
          className="flex items-center gap-1.5 rounded-md bg-blue-600/20 px-3 py-1.5 text-sm text-blue-400 hover:bg-blue-600/30"
        >
          <Plus className="h-3.5 w-3.5" /> New Post
        </button>
      </div>

      <div className="space-y-2">
        {(posts ?? []).map((post: LinkedInPost) => (
          <div key={post.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={post.status} />
                  <StatusBadge status={post.post_type} />
                  {post.theme && <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">{post.theme}</span>}
                  {post.ai_generated && <span className="text-[10px] text-purple-400">AI</span>}
                </div>
                <p className="mt-2 text-sm text-zinc-300 line-clamp-3">{post.content}</p>
                {post.hashtags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {post.hashtags.map((tag) => (
                      <span key={tag} className="text-xs text-blue-400">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {post.status === 'posted' && post.impressions != null && (
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span title="Impressions"><Eye className="mr-1 inline h-3 w-3" />{post.impressions}</span>
                    <span title="Reactions">{post.reactions ?? 0} reactions</span>
                    <span title="Comments">{post.comments_count ?? 0} comments</span>
                    {post.engagement_rate != null && (
                      <span title="Engagement rate" className="flex items-center gap-0.5">
                        <BarChart3 className="h-3 w-3" />
                        {(post.engagement_rate * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
                {(post.status === 'draft' || post.status === 'scheduled') && (
                  <button
                    onClick={() => remove.mutate(post.id)}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2 text-xs text-zinc-500">
              {post.scheduled_at && `Scheduled: ${formatDate(post.scheduled_at)}`}
              {post.posted_at && `Posted: ${formatRelative(post.posted_at)}`}
              {!post.scheduled_at && !post.posted_at && `Created: ${formatRelative(post.created_at)}`}
            </div>
          </div>
        ))}

        {(posts ?? []).length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">No posts found</p>
        )}
      </div>
    </div>
  )
}
