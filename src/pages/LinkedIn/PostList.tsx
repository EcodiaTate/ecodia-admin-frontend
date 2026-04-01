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
import { motion } from 'framer-motion'

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.label}
              onClick={() => setStatus(t.value)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                status === t.value
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface-muted hover:bg-surface-container-low hover:text-on-surface-variant',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={onCompose}
          className="btn-primary-gradient flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.75} /> New Post
        </button>
      </div>

      <div className="space-y-3">
        {(posts ?? []).map((post: LinkedInPost, i: number) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i * 0.03 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={post.status} />
                  <StatusBadge status={post.post_type} />
                  {post.theme && (
                    <span className="rounded-lg bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-muted">{post.theme}</span>
                  )}
                  {post.ai_generated && (
                    <span className="text-label-sm text-primary-container">AI</span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-on-surface-variant line-clamp-3">{post.content}</p>
                {post.hashtags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {post.hashtags.map((tag) => (
                      <span key={tag} className="text-xs text-primary-container">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-3">
                {post.status === 'posted' && post.impressions != null && (
                  <div className="flex items-center gap-3 text-xs text-on-surface-muted">
                    <span title="Impressions"><Eye className="mr-1 inline h-3 w-3" strokeWidth={1.75} />{post.impressions}</span>
                    <span>{post.reactions ?? 0} reactions</span>
                    <span>{post.comments_count ?? 0} comments</span>
                    {post.engagement_rate != null && (
                      <span className="flex items-center gap-0.5">
                        <BarChart3 className="h-3 w-3" strokeWidth={1.75} />
                        {(post.engagement_rate * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
                {(post.status === 'draft' || post.status === 'scheduled') && (
                  <button
                    onClick={() => remove.mutate(post.id)}
                    className="rounded-lg p-1.5 text-on-surface-muted transition-colors hover:bg-error/10 hover:text-error"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 font-mono text-label-sm text-on-surface-muted">
              {post.scheduled_at && `Scheduled: ${formatDate(post.scheduled_at)}`}
              {post.posted_at && `Posted: ${formatRelative(post.posted_at)}`}
              {!post.scheduled_at && !post.posted_at && `Created: ${formatRelative(post.created_at)}`}
            </div>
          </motion.div>
        ))}

        {(posts ?? []).length === 0 && (
          <p className="py-16 text-center text-sm text-on-surface-muted">No posts found</p>
        )}
      </div>
    </div>
  )
}
