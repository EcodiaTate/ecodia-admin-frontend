import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPosts } from '@/api/linkedin'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatRelative, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { LinkedInPost } from '@/types/linkedin'
import { Eye, BarChart3 } from 'lucide-react'
import { motion } from 'framer-motion'

// ─── Post observation lens ────────────────────────────────────────────
// Read-only view of what the system has posted.
// To compose or schedule, tell Cortex.

const STATUS_TABS = [
  { label: 'All', value: undefined },
  { label: 'Drafts', value: 'draft' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Posted', value: 'posted' },
]

export function PostList() {
  const [status, setStatus] = useState<string | undefined>()

  const { data: posts, isLoading } = useQuery({
    queryKey: ['linkedinPosts', status],
    queryFn: () => getPosts({ status, limit: 30 }),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
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

      <div className="space-y-3">
        {(posts ?? []).map((post: LinkedInPost, i: number) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.04 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <StatusBadge status={post.status} />
                  <StatusBadge status={post.post_type} />
                  {post.theme && (
                    <span className="rounded-xl bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-muted">{post.theme}</span>
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

              {post.status === 'posted' && post.impressions != null && (
                <div className="flex shrink-0 items-center gap-3 text-xs text-on-surface-muted">
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
            </div>

            <div className="mt-3 font-mono text-label-sm text-on-surface-muted">
              {post.scheduled_at && `Scheduled: ${formatDate(post.scheduled_at)}`}
              {post.posted_at && `Posted: ${formatRelative(post.posted_at)}`}
              {!post.scheduled_at && !post.posted_at && `Created: ${formatRelative(post.created_at)}`}
            </div>
          </motion.div>
        ))}

        {(posts ?? []).length === 0 && (
          <p className="py-16 text-center text-sm text-on-surface-muted/30">
            No posts yet. Cortex will compose when you ask.
          </p>
        )}
      </div>
    </div>
  )
}
