import { useQuery } from '@tanstack/react-query'
import { getMetaStats, getMetaPages, getMetaPosts, getMetaConversations } from '@/api/meta'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import type { MetaPost, MetaConversation } from '@/types/workspace'
import { cn, formatRelative } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, ThumbsUp, Eye, ExternalLink } from 'lucide-react'
import { useState } from 'react'

const glide = { type: 'spring' as const, stiffness: 90, damping: 20, mass: 1 }

export function MetaTab() {
  const [subTab, setSubTab] = useState<'posts' | 'conversations'>('posts')

  const { data: stats } = useQuery({ queryKey: ['metaStats'], queryFn: getMetaStats, staleTime: 30000 })
  const { data: posts } = useQuery({ queryKey: ['metaPosts'], queryFn: () => getMetaPosts({ limit: 20 }) })
  const { data: conversations } = useQuery({ queryKey: ['metaConversations'], queryFn: () => getMetaConversations({ limit: 20 }) })

  return (
    <div>
      {stats && (
        <div className="mb-10 flex flex-wrap items-start gap-4 sm:gap-6">
          <WhisperStat label="Pages" value={String(stats.total_pages)} />
          <WhisperStat label="Posts" value={String(stats.total_posts)} />
          <WhisperStat label="Followers" value={String(stats.total_followers)} />
          <WhisperStat label="Conversations" value={String(stats.total_conversations)} />
          <WhisperStat label="Messages" value={String(stats.total_messages)} />
          {stats.avg_reach_30d && <WhisperStat label="Avg Reach (30d)" value={String(stats.avg_reach_30d)} />}
        </div>
      )}

      <div className="mb-6 flex items-center gap-1 rounded-2xl bg-surface-container-low/50 p-1 w-fit">
        <button
          onClick={() => setSubTab('posts')}
          className={cn(
            'relative rounded-xl px-4 py-2 text-sm font-medium',
            subTab === 'posts' ? 'text-primary' : 'text-on-surface-muted hover:text-on-surface-variant',
          )}
        >
          {subTab === 'posts' && (
            <motion.div layoutId="meta-sub-tab" className="absolute inset-0 rounded-xl bg-white/60" transition={glide}
              style={{ boxShadow: '0 4px 20px -4px rgba(27, 122, 61, 0.06)' }} />
          )}
          <span className="relative">Posts</span>
        </button>
        <button
          onClick={() => setSubTab('conversations')}
          className={cn(
            'relative rounded-xl px-4 py-2 text-sm font-medium',
            subTab === 'conversations' ? 'text-primary' : 'text-on-surface-muted hover:text-on-surface-variant',
          )}
        >
          {subTab === 'conversations' && (
            <motion.div layoutId="meta-sub-tab" className="absolute inset-0 rounded-xl bg-white/60" transition={glide}
              style={{ boxShadow: '0 4px 20px -4px rgba(27, 122, 61, 0.06)' }} />
          )}
          <span className="relative">Conversations</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'posts' && posts && (
          <motion.div key="posts" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={glide}>
            <div className="space-y-2">
              {posts.map((post: MetaPost) => (
                <div key={post.id} className="rounded-2xl bg-white/40 px-5 py-4 hover:bg-white/55">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-on-surface line-clamp-2">{post.message || post.story || 'No content'}</p>
                      <div className="mt-2 flex items-center gap-4 text-label-sm text-on-surface-muted">
                        {post.created_time && <span>{formatRelative(post.created_time)}</span>}
                        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{post.likes_count}</span>
                        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{post.comments_count}</span>
                        {post.reach != null && <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.reach}</span>}
                      </div>
                    </div>
                    {post.permalink_url && (
                      <a href={post.permalink_url} target="_blank" rel="noopener noreferrer" className="text-on-surface-muted hover:text-primary">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {posts.length === 0 && <p className="text-sm text-on-surface-muted/40">No posts yet.</p>}
            </div>
          </motion.div>
        )}

        {subTab === 'conversations' && conversations && (
          <motion.div key="conversations" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={glide}>
            <div className="space-y-2">
              {conversations.map((conv: MetaConversation) => (
                <div key={conv.id} className="rounded-2xl bg-white/40 px-5 py-4 hover:bg-white/55">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-on-surface">{conv.participant_name || 'Unknown'}</p>
                      <p className="text-label-sm text-on-surface-muted line-clamp-1">{conv.last_message || 'No messages'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">{conv.platform}</span>
                      {conv.last_message_at && <span className="text-label-sm text-on-surface-muted">{formatRelative(conv.last_message_at)}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && <p className="text-sm text-on-surface-muted/40">No conversations yet.</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
