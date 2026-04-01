import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDMStats, getWorkerStatus, getConnectionRequests, getPosts, resumeWorker } from '@/api/linkedin'
import { DMList } from './DMList'
import { DMDetail } from './DMDetail'
import { PostList } from './PostList'
import { PostComposer } from './PostComposer'
import { ConnectionRequests } from './ConnectionRequests'
import { ContentCalendar } from './ContentCalendar'
import { AnalyticsSummary } from './AnalyticsSummary'
import { LinkedInSettings } from './LinkedInSettings'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { AmbientPulse } from '@/components/spatial/AmbientPulse'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import type { LinkedInDM } from '@/types/linkedin'
import type { WorkerStatus } from '@/store/workerStore'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Target, UserPlus, PenSquare, ArrowLeft,
} from 'lucide-react'

type Tab = 'dms' | 'posts' | 'calendar' | 'connections' | 'analytics' | 'settings'

export default function LinkedInPage() {
  const [tab, setTab] = useState<Tab>('dms')
  const [selectedDM, setSelectedDM] = useState<LinkedInDM | null>(null)
  const [showComposer, setShowComposer] = useState(false)

  const { data: dmStats } = useQuery({ queryKey: ['linkedinDMStats'], queryFn: getDMStats })
  const { data: workerStatus } = useQuery({ queryKey: ['linkedinWorkerStatus'], queryFn: getWorkerStatus, refetchInterval: 30000 })
  const { data: connRequests } = useQuery({ queryKey: ['linkedinConnectionRequests'], queryFn: () => getConnectionRequests({ status: 'pending' }) })
  const { data: posts } = useQuery({ queryKey: ['linkedinPostsWeek'], queryFn: () => getPosts({ status: 'posted', limit: 7 }) })

  const linkedinWorker = useWorkerStatus('linkedin') as WorkerStatus | null
  const isSuspended = workerStatus?.status === 'suspended'

  const tabs: { key: Tab; label: string }[] = [
    { key: 'dms', label: 'DMs' },
    { key: 'posts', label: 'Posts' },
    { key: 'calendar', label: 'Calendar' },
    { key: 'connections', label: 'Connections' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'settings', label: 'Settings' },
  ]

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
            Network Intelligence
          </span>
          <h1 className="mt-3 font-display text-display-md font-light text-on-surface">
            Social <em className="not-italic font-normal text-primary">Resonance</em>
          </h1>
        </div>

        {/* Worker status as AmbientPulse — suspended state shows inline */}
        <div className="flex items-center gap-3 pt-2">
          {linkedinWorker && !isSuspended && (
            <AmbientPulse label="Worker" lastSyncAt={linkedinWorker.lastSync} status={linkedinWorker.status} />
          )}
          {isSuspended && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 rounded-xl bg-error/5 px-3 py-1.5"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-error opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-error" />
              </span>
              <span className="text-label-sm text-error">{workerStatus.reason}</span>
              <button
                onClick={async () => { await resumeWorker(); toast.success('Worker resumed') }}
                className="ml-1 text-label-sm font-medium text-error/70 underline underline-offset-2 transition-colors hover:text-error"
              >
                Resume
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Whisper stats — ambient counters */}
      <div className="mb-10 flex gap-8">
        <WhisperStat
          label="Unread DMs"
          value={dmStats?.unread ?? 0}
          icon={MessageSquare}
          accent="text-tertiary"
          onClick={() => setTab('dms')}
        />
        <WhisperStat
          label="Leads"
          value={dmStats?.leads ?? 0}
          icon={Target}
          accent="text-secondary"
          onClick={() => setTab('dms')}
        />
        <WhisperStat
          label="Pending"
          value={connRequests?.length ?? 0}
          icon={UserPlus}
          accent="text-primary"
          onClick={() => setTab('connections')}
        />
        <WhisperStat
          label="Posts"
          value={posts?.length ?? 0}
          icon={PenSquare}
          accent="text-primary-container"
          onClick={() => setTab('posts')}
        />
      </div>

      {/* Tabs — text only, no icons */}
      <div className="mb-8 flex items-center gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSelectedDM(null); setShowComposer(false) }}
            className={cn(
              'rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t.key
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-muted hover:bg-surface-container-low hover:text-on-surface-variant',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={tab + (tab === 'dms' && selectedDM ? '-detail' : '') + (tab === 'posts' && showComposer ? '-compose' : '')}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -10 }}
          transition={{ type: 'spring', stiffness: 250, damping: 25 }}
        >
          {tab === 'dms' && (
            selectedDM ? (
              <div>
                <button
                  onClick={() => setSelectedDM(null)}
                  className="mb-6 flex items-center gap-2 text-sm text-on-surface-muted transition-colors hover:text-on-surface-variant"
                >
                  <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} /> Back to DMs
                </button>
                <DMDetail dmId={selectedDM.id} />
              </div>
            ) : (
              <DMList onSelect={setSelectedDM} />
            )
          )}

          {tab === 'posts' && (
            showComposer ? (
              <div>
                <button
                  onClick={() => setShowComposer(false)}
                  className="mb-6 flex items-center gap-2 text-sm text-on-surface-muted transition-colors hover:text-on-surface-variant"
                >
                  <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} /> Back to posts
                </button>
                <PostComposer onSaved={() => setShowComposer(false)} />
              </div>
            ) : (
              <PostList onCompose={() => setShowComposer(true)} />
            )
          )}

          {tab === 'calendar' && <ContentCalendar />}
          {tab === 'connections' && <ConnectionRequests />}
          {tab === 'analytics' && <AnalyticsSummary />}
          {tab === 'settings' && <LinkedInSettings />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
