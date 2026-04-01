import { useQuery } from '@tanstack/react-query'
import { getNetworkSnapshots, getAnalyticsSummary, getPostAnalytics } from '@/api/linkedin'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn } from '@/lib/utils'
import type { NetworkSnapshot } from '@/types/linkedin'
import { TrendingUp, TrendingDown, Users, Eye, Search, FileText } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export function AnalyticsSummary() {
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['linkedinAnalyticsSummary'],
    queryFn: getAnalyticsSummary,
  })

  const { data: snapshots, isLoading: loadingSnapshots } = useQuery({
    queryKey: ['linkedinNetworkSnapshots'],
    queryFn: () => getNetworkSnapshots(30),
  })

  const { data: postAnalytics } = useQuery({
    queryKey: ['linkedinPostAnalytics'],
    queryFn: getPostAnalytics,
  })

  if (loadingSummary || loadingSnapshots) return <LoadingSpinner />

  const tw = summary?.thisWeek || {}
  const lw = summary?.lastWeek || {}
  const ps = summary?.postStats || {}

  const compareCards = [
    {
      label: 'Connections',
      value: tw.connections ?? 0,
      prev: lw.connections ?? 0,
      icon: Users,
      color: 'text-blue-400',
    },
    {
      label: 'Profile Views',
      value: tw.profile_views ?? 0,
      prev: lw.profile_views ?? 0,
      icon: Eye,
      color: 'text-purple-400',
    },
    {
      label: 'Search Appearances',
      value: tw.search_appearances ?? 0,
      prev: lw.search_appearances ?? 0,
      icon: Search,
      color: 'text-yellow-400',
    },
    {
      label: 'Posts This Week',
      value: ps.posts_count ?? 0,
      prev: null,
      icon: FileText,
      color: 'text-emerald-400',
    },
  ]

  const chartData = (snapshots ?? []).map((s: NetworkSnapshot) => ({
    date: new Date(s.snapshot_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
    connections: s.connection_count,
    followers: s.follower_count,
    profileViews: s.profile_views_week,
  }))

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {compareCards.map((card) => {
          const diff = card.prev != null ? card.value - card.prev : null
          const isUp = diff != null && diff > 0
          const isDown = diff != null && diff < 0
          return (
            <div key={card.label} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-zinc-400">{card.label}</span>
                <card.icon className={cn('h-4 w-4', card.color)} />
              </div>
              <p className={cn('mt-1 text-2xl font-semibold', card.color)}>
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </p>
              {diff != null && (
                <div className="mt-1 flex items-center gap-1">
                  {isUp && <TrendingUp className="h-3 w-3 text-emerald-400" />}
                  {isDown && <TrendingDown className="h-3 w-3 text-red-400" />}
                  <span className={cn('text-xs', isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-zinc-500')}>
                    {diff > 0 ? '+' : ''}{diff} vs last week
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Post totals */}
      {postAnalytics && (
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <span className="text-xs text-zinc-500">Total Posts</span>
            <p className="text-xl font-semibold text-zinc-200">{postAnalytics.total_posts}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <span className="text-xs text-zinc-500">Total Impressions</span>
            <p className="text-xl font-semibold text-zinc-200">{postAnalytics.total_impressions.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <span className="text-xs text-zinc-500">Total Reactions</span>
            <p className="text-xl font-semibold text-zinc-200">{postAnalytics.total_reactions.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <span className="text-xs text-zinc-500">Avg Engagement</span>
            <p className="text-xl font-semibold text-zinc-200">
              {postAnalytics.avg_engagement ? (postAnalytics.avg_engagement * 100).toFixed(2) + '%' : 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Network Growth */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h3 className="text-sm font-medium text-zinc-400">Network Growth</h3>
          <div className="mt-4 h-48">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Line type="monotone" dataKey="connections" stroke="#60a5fa" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="followers" stroke="#a78bfa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                No data yet. Analytics will populate after the daily network scrape.
              </div>
            )}
          </div>
          <div className="mt-2 flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" />Connections</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-400" />Followers</span>
          </div>
        </div>

        {/* Profile Views */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h3 className="text-sm font-medium text-zinc-400">Profile Views</h3>
          <div className="mt-4 h-48">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#71717a', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#a1a1aa' }}
                  />
                  <Bar dataKey="profileViews" fill="#a78bfa" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                No data yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
