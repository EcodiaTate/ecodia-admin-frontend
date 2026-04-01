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
import {
  MessageSquare, FileText, Calendar, Users, BarChart3, Settings,
  AlertTriangle, Target, UserPlus, PenSquare, Wifi, WifiOff,
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
    { label: 'Unread DMs', value: dmStats?.unread ?? 0, icon: MessageSquare, color: 'text-yellow-400', onClick: () => setTab('dms') },
    { label: 'Leads', value: dmStats?.leads ?? 0, icon: Target, color: 'text-emerald-400', onClick: () => setTab('dms') },
    { label: 'Pending Connections', value: connRequests?.length ?? 0, icon: UserPlus, color: 'text-blue-400', onClick: () => setTab('connections') },
    { label: 'Posts This Week', value: posts?.length ?? 0, icon: PenSquare, color: 'text-purple-400', onClick: () => setTab('posts') },
    {
      label: 'Worker',
      value: isWorkerActive ? 'Active' : workerStatus?.status ?? 'Unknown',
      icon: isWorkerActive ? Wifi : WifiOff,
      color: isWorkerActive ? 'text-green-400' : 'text-red-400',
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">LinkedIn Intelligence</h1>
        {workerStatus?.status === 'suspended' && (
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400">Suspended: {workerStatus.reason}</span>
            <button
              onClick={async () => { await resumeWorker(); toast.success('Worker resumed') }}
              className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700"
            >
              Resume
            </button>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-5 gap-3">
        {statCards.map((card) => (
          <button
            key={card.label}
            onClick={card.onClick}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-colors hover:bg-zinc-800/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{card.label}</span>
              <card.icon className={cn('h-4 w-4', card.color)} />
            </div>
            <p className={cn('mt-1 text-2xl font-semibold', card.color)}>{card.value}</p>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800 pb-px">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSelectedDM(null); setShowComposer(false) }}
            className={cn(
              'flex items-center gap-1.5 rounded-t-md px-3 py-2 text-sm transition-colors',
              tab === t.key
                ? 'border-b-2 border-blue-500 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'dms' && (
        selectedDM ? (
          <div>
            <button onClick={() => setSelectedDM(null)} className="mb-4 text-sm text-zinc-400 hover:text-zinc-200">&larr; Back to DMs</button>
            <DMDetail dmId={selectedDM.id} />
          </div>
        ) : (
          <DMList onSelect={setSelectedDM} />
        )
      )}

      {tab === 'posts' && (
        showComposer ? (
          <div>
            <button onClick={() => setShowComposer(false)} className="mb-4 text-sm text-zinc-400 hover:text-zinc-200">&larr; Back to posts</button>
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
    </div>
  )
}
