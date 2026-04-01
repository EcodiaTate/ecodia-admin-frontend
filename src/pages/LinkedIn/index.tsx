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
import type { LinkedInDM } from '@/types/linkedin'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import {
  MessageSquare, FileText, Calendar, Users, BarChart3, Settings,
  AlertTriangle, Target, UserPlus, PenSquare, Wifi, WifiOff, ArrowLeft,
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

  const isWorkerActive = workerStatus?.status === 'active' || workerStatus?.status === 'inactive'

  const statCards = [
    { label: 'Unread DMs', value: dmStats?.unread ?? 0, icon: MessageSquare, accent: 'text-tertiary', onClick: () => setTab('dms') },
    { label: 'Leads', value: dmStats?.leads ?? 0, icon: Target, accent: 'text-secondary', onClick: () => setTab('dms') },
    { label: 'Pending', value: connRequests?.length ?? 0, icon: UserPlus, accent: 'text-primary', onClick: () => setTab('connections') },
    { label: 'Posts', value: posts?.length ?? 0, icon: PenSquare, accent: 'text-primary-container', onClick: () => setTab('posts') },
    {
      label: 'Worker',
      value: isWorkerActive ? 'Active' : workerStatus?.status ?? 'Unknown',
      icon: isWorkerActive ? Wifi : WifiOff,
      accent: isWorkerActive ? 'text-secondary' : 'text-error',
      onClick: () => setTab('settings'),
    },
  ]

  const tabs: { key: Tab; label: string; icon: typeof MessageSquare }[] = [
    { key: 'dms', label: 'DMs', icon: MessageSquare },
    { key: 'posts', label: 'Posts', icon: FileText },
    { key: 'calendar', label: 'Calendar', icon: Calendar },
    { key: 'connections', label: 'Connections', icon: Users },
    { key: 'analytics', label: 'Analytics', icon: BarChart3 },
    { key: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-12 flex items-start justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
            Network Intelligence
          </span>
          <h1 className="mt-3 font-display text-display-md font-light text-on-surface">
            Social <em className="not-italic font-normal text-primary">Resonance</em>
          </h1>
        </div>
        {workerStatus?.status === 'suspended' && (
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-error" strokeWidth={1.75} />
            <span className="text-sm text-error">{workerStatus.reason}</span>
            <button
              onClick={async () => { await resumeWorker(); toast.success('Worker resumed') }}
              className="rounded-xl bg-secondary/10 px-3 py-1.5 text-sm font-medium text-secondary transition-colors hover:bg-secondary/20"
            >
              Resume
            </button>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="mb-12 grid grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24, delay: i * 0.05 }}
          >
            <GlassPanel depth="elevated" parallax holo onClick={card.onClick} className="p-6 text-left">
              <div className="flex items-center justify-between">
                <span className="text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">{card.label}</span>
                <card.icon className={cn('h-4 w-4', card.accent)} strokeWidth={1.75} />
              </div>
              <p className={cn('mt-3 font-display text-xl font-light', card.accent)}>{card.value}</p>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-8 flex items-center gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSelectedDM(null); setShowComposer(false) }}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
              tab === t.key
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-muted hover:bg-surface-container-low hover:text-on-surface-variant',
            )}
          >
            <t.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content — AnimatePresence for tab switches */}
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
