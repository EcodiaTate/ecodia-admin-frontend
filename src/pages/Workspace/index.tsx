import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDriveStats, searchDrive } from '@/api/drive'
import { getVercelStats, getVercelProjects, getVercelDeployments } from '@/api/vercel'
import { getMetaStats, getMetaPages, getMetaPosts, getMetaConversations } from '@/api/meta'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { AmbientPulse } from '@/components/spatial/AmbientPulse'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import type { WorkerStatus } from '@/store/workerStore'
import type { DriveFile, VercelDeployment, MetaPost, MetaConversation } from '@/types/workspace'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import {
  HardDrive, Cloud, Share2, Search, FileText, Sheet, FileImage,
  GitBranch, CheckCircle2, XCircle, Clock, Rocket,
  MessageCircle, ThumbsUp, Eye, ExternalLink,
} from 'lucide-react'

type Tab = 'drive' | 'vercel' | 'meta'

const glide = { type: 'spring' as const, stiffness: 90, damping: 20, mass: 1 }

export default function WorkspacePage() {
  const [tab, setTab] = useState<Tab>('drive')
  const workers = useWorkerStatus() as Record<string, WorkerStatus>

  const tabs: { key: Tab; label: string; icon: typeof HardDrive }[] = [
    { key: 'drive', label: 'Drive', icon: HardDrive },
    { key: 'vercel', label: 'Vercel', icon: Cloud },
    { key: 'meta', label: 'Social', icon: Share2 },
  ]

  return (
    <div className="mx-auto max-w-6xl preserve-3d-deep">
      {/* Header — floats closest */}
      <SpatialLayer z={25} className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
            Connected Systems
          </span>
          <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
            External <em className="not-italic font-normal text-primary">Workspace</em>
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:pt-2">
          {workers.google_drive && <AmbientPulse label="Drive" lastSyncAt={workers.google_drive.lastSync} status={workers.google_drive.status} />}
          {workers.vercel && <AmbientPulse label="Vercel" lastSyncAt={workers.vercel.lastSync} status={workers.vercel.status} />}
          {workers.meta && <AmbientPulse label="Meta" lastSyncAt={workers.meta.lastSync} status={workers.meta.status} />}
        </div>
      </SpatialLayer>

      {/* Tabs */}
      <SpatialLayer z={10} className="mb-8 flex items-center gap-1 rounded-2xl bg-surface-container-low/50 p-1 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              tab === key ? 'text-primary' : 'text-on-surface-muted hover:text-on-surface-variant',
            )}
          >
            {tab === key && (
              <motion.div
                layoutId="workspace-tab-bg"
                className="absolute inset-0 rounded-xl bg-white/60"
                style={{ boxShadow: '0 4px 20px -4px rgba(0, 104, 122, 0.06)' }}
                transition={glide}
              />
            )}
            <Icon className="relative h-4 w-4" strokeWidth={1.75} />
            <span className="relative">{label}</span>
          </button>
        ))}
      </SpatialLayer>

      {/* Tab Content — recessed */}
      <SpatialLayer z={-8}>
      <AnimatePresence mode="wait">
        {tab === 'drive' && (
          <motion.div key="drive" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={glide}>
            <DriveTab />
          </motion.div>
        )}
        {tab === 'vercel' && (
          <motion.div key="vercel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={glide}>
            <VercelTab />
          </motion.div>
        )}
        {tab === 'meta' && (
          <motion.div key="meta" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={glide}>
            <MetaTab />
          </motion.div>
        )}
      </AnimatePresence>
      </SpatialLayer>
    </div>
  )
}

// ─── Drive Tab ─────────────────────────────────────────────────────────

function DriveTab() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<DriveFile[]>([])

  const { data: stats } = useQuery({ queryKey: ['driveStats'], queryFn: getDriveStats, staleTime: 30000 })

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const results = await searchDrive(searchQuery)
      setSearchResults(results)
    } finally {
      setIsSearching(false)
    }
  }

  const mimeIcon = (mime: string) => {
    if (mime.includes('document') || mime.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />
    if (mime.includes('spreadsheet') || mime.includes('sheet') || mime.includes('csv')) return <Sheet className="h-4 w-4 text-green-500" />
    if (mime.includes('pdf')) return <FileImage className="h-4 w-4 text-red-400" />
    return <FileText className="h-4 w-4 text-on-surface-muted" />
  }

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="mb-10 flex flex-wrap items-start gap-4 sm:gap-6">
          <WhisperStat label="Total Files" value={stats.total_files.toLocaleString()} />
          <WhisperStat label="Documents" value={String(stats.docs)} />
          <WhisperStat label="Spreadsheets" value={String(stats.sheets)} />
          <WhisperStat label="PDFs" value={String(stats.pdfs)} />
          <WhisperStat label="Content Extracted" value={String(stats.with_content)} />
          <WhisperStat label="Embedded in KG" value={String(stats.embedded)} />
        </div>
      )}

      {/* Search */}
      <div className="mb-8 flex items-center gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-muted" />
          <input
            type="text"
            placeholder="Search files and content..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="h-11 w-full rounded-xl bg-surface-container-low/60 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-muted/50 outline-none focus:bg-white/60 transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="h-11 rounded-xl bg-primary/10 px-5 text-sm font-medium text-primary transition-colors hover:bg-primary/15 disabled:opacity-40"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <span className="text-label-sm uppercase tracking-wider text-on-surface-muted">{searchResults.length} results</span>
          {searchResults.map(file => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 rounded-2xl bg-white/40 px-5 py-4 transition-colors hover:bg-white/55"
            >
              {mimeIcon(file.mime_type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">{file.name}</p>
                <p className="text-label-sm text-on-surface-muted">
                  {file.parent_folder_name && <span>{file.parent_folder_name} / </span>}
                  {file.modified_time && formatRelative(file.modified_time)}
                  {file.last_modifying_user && <span> by {file.last_modifying_user}</span>}
                </p>
              </div>
              {file.has_content && (
                <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-secondary">indexed</span>
              )}
              {file.web_view_link && (
                <a href={file.web_view_link} target="_blank" rel="noopener noreferrer" className="text-on-surface-muted hover:text-primary transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {searchResults.length === 0 && !isSearching && searchQuery && (
        <p className="text-sm text-on-surface-muted">No results found</p>
      )}
    </div>
  )
}

// ─── Vercel Tab ────────────────────────────────────────────────────────

function VercelTab() {
  const { data: stats } = useQuery({ queryKey: ['vercelStats'], queryFn: getVercelStats, staleTime: 30000 })
  const { data: projects } = useQuery({ queryKey: ['vercelProjects'], queryFn: getVercelProjects })
  const { data: deployments } = useQuery({ queryKey: ['vercelDeployments'], queryFn: () => getVercelDeployments({ limit: 20 }) })

  const stateIcon = (state: VercelDeployment['state']) => {
    switch (state) {
      case 'READY': return <CheckCircle2 className="h-4 w-4 text-secondary" />
      case 'ERROR': return <XCircle className="h-4 w-4 text-error" />
      case 'BUILDING': return <Clock className="h-4 w-4 text-tertiary animate-pulse" />
      case 'QUEUED': return <Clock className="h-4 w-4 text-on-surface-muted" />
      default: return <Clock className="h-4 w-4 text-on-surface-muted" />
    }
  }

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="mb-10 flex flex-wrap items-start gap-4 sm:gap-6">
          <WhisperStat label="Projects" value={String(stats.total_projects)} />
          <WhisperStat label="Total Deploys" value={String(stats.total_deployments)} />
          <WhisperStat label="Deployed (24h)" value={String(stats.deployed_24h)} />
          <WhisperStat label="Failed (24h)" value={String(stats.failed_24h)} accent={stats.failed_24h > 0 ? 'error' : undefined} />
          <WhisperStat label="Building Now" value={String(stats.building_now)} accent={stats.building_now > 0 ? 'tertiary' : undefined} />
        </div>
      )}

      {/* Projects Grid */}
      {projects && projects.length > 0 && (
        <div className="mb-12">
          <h3 className="mb-4 text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">Projects</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-white/40 p-5 transition-colors hover:bg-white/55"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{project.name}</p>
                    <p className="text-label-sm text-on-surface-muted">{project.framework || 'No framework'}</p>
                  </div>
                  <Rocket className="h-4 w-4 shrink-0 text-primary/40" />
                </div>
                <div className="mt-3 flex items-center gap-3 text-label-sm text-on-surface-muted">
                  <span>{project.deployment_count} deploys</span>
                  {project.git_repo && <span className="truncate">{project.git_repo}</span>}
                </div>
                {project.production_url && (
                  <a href={project.production_url} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-label-sm text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    {project.production_url.replace('https://', '')}
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Deployments */}
      {deployments && deployments.length > 0 && (
        <div>
          <h3 className="mb-4 text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">Recent Deployments</h3>
          <div className="space-y-2">
            {deployments.map(dep => (
              <motion.div
                key={dep.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 rounded-2xl bg-white/40 px-5 py-3.5 transition-colors hover:bg-white/55"
              >
                {stateIcon(dep.state)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-on-surface truncate">{dep.project_name || 'Unknown'}</p>
                    {dep.target === 'production' && (
                      <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-medium uppercase text-secondary">prod</span>
                    )}
                  </div>
                  <p className="text-label-sm text-on-surface-muted truncate">
                    {dep.git_commit_message || dep.git_branch || 'No commit info'}
                  </p>
                </div>
                <div className="hidden sm:flex flex-col items-end gap-0.5">
                  {dep.git_branch && (
                    <span className="flex items-center gap-1 text-label-sm text-on-surface-muted">
                      <GitBranch className="h-3 w-3" />
                      {dep.git_branch}
                    </span>
                  )}
                  <span className="text-label-sm text-on-surface-muted">{formatRelative(dep.created_at)}</span>
                </div>
                <StatusBadge status={dep.state} />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Meta Tab ──────────────────────────────────────────────────────────

function MetaTab() {
  const [subTab, setSubTab] = useState<'posts' | 'conversations'>('posts')

  const { data: stats } = useQuery({ queryKey: ['metaStats'], queryFn: getMetaStats, staleTime: 30000 })
  const { data: pages } = useQuery({ queryKey: ['metaPages'], queryFn: getMetaPages })
  const { data: posts } = useQuery({ queryKey: ['metaPosts'], queryFn: () => getMetaPosts({ limit: 20 }) })
  const { data: conversations } = useQuery({ queryKey: ['metaConversations'], queryFn: () => getMetaConversations({ limit: 20 }) })

  return (
    <div>
      {/* Stats */}
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

      {/* Pages */}
      {pages && pages.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-4 text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">Pages</h3>
          <div className="flex flex-wrap gap-3">
            {pages.map(page => (
              <div key={page.id} className="rounded-2xl bg-white/40 px-5 py-3 transition-colors hover:bg-white/55">
                <p className="text-sm font-medium text-on-surface">{page.name}</p>
                <p className="text-label-sm text-on-surface-muted">
                  {page.followers_count} followers · {page.post_count} posts · {page.conversation_count} conversations
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sub-tabs: Posts / Conversations */}
      <div className="mb-6 flex items-center gap-1 rounded-2xl bg-surface-container-low/50 p-1 w-fit">
        <button
          onClick={() => setSubTab('posts')}
          className={cn(
            'relative rounded-xl px-4 py-2 text-sm font-medium transition-colors',
            subTab === 'posts' ? 'text-primary' : 'text-on-surface-muted hover:text-on-surface-variant',
          )}
        >
          {subTab === 'posts' && (
            <motion.div layoutId="meta-sub-tab" className="absolute inset-0 rounded-xl bg-white/60" transition={glide}
              style={{ boxShadow: '0 4px 20px -4px rgba(0, 104, 122, 0.06)' }} />
          )}
          <span className="relative">Posts</span>
        </button>
        <button
          onClick={() => setSubTab('conversations')}
          className={cn(
            'relative rounded-xl px-4 py-2 text-sm font-medium transition-colors',
            subTab === 'conversations' ? 'text-primary' : 'text-on-surface-muted hover:text-on-surface-variant',
          )}
        >
          {subTab === 'conversations' && (
            <motion.div layoutId="meta-sub-tab" className="absolute inset-0 rounded-xl bg-white/60" transition={glide}
              style={{ boxShadow: '0 4px 20px -4px rgba(0, 104, 122, 0.06)' }} />
          )}
          <span className="relative">Conversations</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'posts' && posts && (
          <motion.div key="posts" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={glide}>
            <div className="space-y-2">
              {posts.map((post: MetaPost) => (
                <div key={post.id} className="rounded-2xl bg-white/40 px-5 py-4 transition-colors hover:bg-white/55">
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
                <div key={conv.id} className="rounded-2xl bg-white/40 px-5 py-4 transition-colors hover:bg-white/55">
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
              {conversations.length === 0 && <p className="text-sm text-on-surface-muted">No conversations yet</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
