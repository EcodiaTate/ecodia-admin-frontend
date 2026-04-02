import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMetaStats, getMetaPages, getMetaPosts, getMetaConversations, syncMeta, publishMetaPost, sendMetaMessage } from '@/api/meta'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import type { MetaPost, MetaConversation, MetaPage } from '@/types/workspace'
import { cn, formatRelative } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, ThumbsUp, Eye, ExternalLink, RefreshCw, Plus, Send, X, ChevronDown } from 'lucide-react'
import toast from 'react-hot-toast'

const glide = { type: 'spring' as const, stiffness: 90, damping: 20, mass: 1 }

export function MetaTab() {
  const [subTab, setSubTab] = useState<'posts' | 'conversations'>('posts')
  const [showCompose, setShowCompose] = useState(false)
  const [replyingTo, setReplyingTo] = useState<MetaConversation | null>(null)
  const queryClient = useQueryClient()

  const { data: stats } = useQuery({ queryKey: ['metaStats'], queryFn: getMetaStats, staleTime: 30000 })
  const { data: pages } = useQuery({ queryKey: ['metaPages'], queryFn: getMetaPages })
  const { data: posts } = useQuery({ queryKey: ['metaPosts'], queryFn: () => getMetaPosts({ limit: 20 }) })
  const { data: conversations } = useQuery({ queryKey: ['metaConversations'], queryFn: () => getMetaConversations({ limit: 20 }) })

  const sync = useMutation({
    mutationFn: syncMeta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metaStats'] })
      queryClient.invalidateQueries({ queryKey: ['metaPosts'] })
      queryClient.invalidateQueries({ queryKey: ['metaConversations'] })
      toast.success('Meta synced')
    },
    onError: () => toast.error('Sync failed'),
  })

  return (
    <div>
      {/* Stats row + sync */}
      <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
        {stats && (
          <div className="flex flex-wrap items-start gap-4 sm:gap-6">
            <WhisperStat label="Pages" value={String(stats.total_pages)} />
            <WhisperStat label="Posts" value={String(stats.total_posts)} />
            <WhisperStat label="Followers" value={String(stats.total_followers)} />
            <WhisperStat label="Conversations" value={String(stats.total_conversations)} />
            <WhisperStat label="Messages" value={String(stats.total_messages)} />
            {stats.avg_reach_30d && <WhisperStat label="Avg Reach (30d)" value={String(stats.avg_reach_30d)} />}
          </div>
        )}
        <button
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          className="flex items-center gap-1.5 rounded-xl bg-surface-container-low px-3 py-2 text-sm text-on-surface-muted hover:bg-white/60 hover:text-on-surface-variant disabled:opacity-40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${sync.isPending ? 'animate-spin' : ''}`} strokeWidth={1.75} />
          Sync
        </button>
      </div>

      {pages && pages.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">Pages</h3>
          <div className="flex flex-wrap gap-3">
            {pages.map((page: MetaPage) => (
              <div key={page.id} className="rounded-2xl bg-white/40 px-5 py-3 hover:bg-white/55">
                <p className="text-sm font-medium text-on-surface">{page.name}</p>
                <p className="text-label-sm text-on-surface-muted">
                  {page.followers_count} followers · {page.post_count} posts · {page.conversation_count} conversations
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs + compose action */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 rounded-2xl bg-surface-container-low/50 p-1 w-fit">
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

        {subTab === 'posts' && (
          <button
            onClick={() => setShowCompose(!showCompose)}
            className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/15"
          >
            {showCompose ? <X className="h-3.5 w-3.5" strokeWidth={2} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2} />}
            {showCompose ? 'Cancel' : 'New Post'}
          </button>
        )}
      </div>

      {/* Compose form */}
      <AnimatePresence>
        {showCompose && subTab === 'posts' && pages && pages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={glide}
            className="mb-6 overflow-hidden"
          >
            <ComposePost
              pages={pages}
              onPublished={() => {
                setShowCompose(false)
                queryClient.invalidateQueries({ queryKey: ['metaPosts'] })
                queryClient.invalidateQueries({ queryKey: ['metaStats'] })
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

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
              {posts.length === 0 && <p className="text-sm text-on-surface-muted">No posts yet</p>}
            </div>
          </motion.div>
        )}

        {subTab === 'conversations' && conversations && (
          <motion.div key="conversations" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={glide}>
            <div className="space-y-2">
              {conversations.map((conv: MetaConversation) => (
                <ConversationRow
                  key={conv.id}
                  conv={conv}
                  isExpanded={replyingTo?.id === conv.id}
                  onToggle={() => setReplyingTo(replyingTo?.id === conv.id ? null : conv)}
                />
              ))}
              {conversations.length === 0 && <p className="text-sm text-on-surface-muted">No conversations yet</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Compose Post ─────────────────────────────────────────────────────

function ComposePost({ pages, onPublished }: { pages: MetaPage[]; onPublished: () => void }) {
  const [selectedPage, setSelectedPage] = useState(pages[0]?.id ?? '')
  const [message, setMessage] = useState('')
  const [link, setLink] = useState('')

  const publish = useMutation({
    mutationFn: () => publishMetaPost(selectedPage, message, link || undefined),
    onSuccess: () => {
      toast.success('Post published')
      onPublished()
    },
    onError: () => toast.error('Failed to publish'),
  })

  const inputClass = 'w-full rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder-on-surface-muted/40 outline-none focus:bg-white/60'

  return (
    <div className="rounded-2xl bg-white/50 p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">Page</label>
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className={inputClass}
          >
            {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">Link (optional)</label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          className={`${inputClass} resize-none`}
        />
      </div>
      <div className="flex justify-end">
        <motion.button
          onClick={() => message.trim() && publish.mutate()}
          disabled={!message.trim() || !selectedPage || publish.isPending}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary-gradient flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
          {publish.isPending ? 'Publishing...' : 'Publish'}
        </motion.button>
      </div>
    </div>
  )
}

// ─── Conversation Row with reply ──────────────────────────────────────

function ConversationRow({
  conv,
  isExpanded,
  onToggle,
}: {
  conv: MetaConversation
  isExpanded: boolean
  onToggle: () => void
}) {
  const [replyText, setReplyText] = useState('')

  const sendReply = useMutation({
    mutationFn: () => sendMetaMessage(conv.id, replyText, conv.page_id ?? ''),
    onSuccess: () => {
      toast.success('Message sent')
      setReplyText('')
      onToggle()
    },
    onError: () => toast.error('Failed to send'),
  })

  return (
    <div className={`rounded-2xl transition-colors ${isExpanded ? 'bg-white/60' : 'bg-white/40 hover:bg-white/50'}`}>
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
        <div>
          <p className="text-sm font-medium text-on-surface">{conv.participant_name || 'Unknown'}</p>
          <p className="text-label-sm text-on-surface-muted line-clamp-1">{conv.last_message || 'No messages'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium uppercase text-primary">{conv.platform}</span>
          {conv.last_message_at && <span className="text-label-sm text-on-surface-muted">{formatRelative(conv.last_message_at)}</span>}
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}>
            <ChevronDown className="h-3.5 w-3.5 text-on-surface-muted/40" strokeWidth={1.75} />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            className="overflow-hidden"
          >
            <div className="border-t border-on-surface-muted/8 px-5 pb-4 pt-3 flex gap-3">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && replyText.trim() && sendReply.mutate()}
                placeholder="Reply..."
                className="flex-1 rounded-xl bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder-on-surface-muted/40 outline-none focus:bg-white/70"
              />
              <button
                onClick={() => replyText.trim() && sendReply.mutate()}
                disabled={!replyText.trim() || sendReply.isPending}
                className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2.5 text-sm text-primary hover:bg-primary/15 disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
