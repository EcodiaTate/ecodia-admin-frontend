import { useQuery } from '@tanstack/react-query'
import { getNetworkSnapshots, getAnalyticsSummary, getPostAnalytics } from '@/api/linkedin'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn } from '@/lib/utils'
import type { NetworkSnapshot } from '@/types/linkedin'
import { TrendingUp, TrendingDown, Users, Eye, Search, FileText } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

const glassTooltipStyle = {
  background: 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  borderRadius: '12px',
  boxShadow: '0 12px 32px -8px rgba(0, 104, 122, 0.06)',
  color: '#1A1C1C',
  fontSize: '12px',
}

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
    { label: 'Connections', value: tw.connections ?? 0, prev: lw.connections ?? 0, icon: Users, accent: 'text-primary' },
    { label: 'Profile Views', value: tw.profile_views ?? 0, prev: lw.profile_views ?? 0, icon: Eye, accent: 'text-primary-container' },
    { label: 'Search Appearances', value: tw.search_appearances ?? 0, prev: lw.search_appearances ?? 0, icon: Search, accent: 'text-tertiary' },
    { label: 'Posts This Week', value: ps.posts_count ?? 0, prev: null, icon: FileText, accent: 'text-secondary' },
  ]

  const chartData = (snapshots ?? []).map((s: NetworkSnapshot) => ({
    date: new Date(s.snapshot_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
    connections: s.connection_count,
    followers: s.follower_count,
    profileViews: s.profile_views_week,
  }))

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {compareCards.map((card, i) => {
          const diff = card.prev != null ? card.value - card.prev : null
          const isUp = diff != null && diff > 0
          const isDown = diff != null && diff < 0
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 24, delay: i * 0.06 }}
              className="glass rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">{card.label}</span>
                <card.icon className={cn('h-4 w-4', card.accent)} strokeWidth={1.75} />
              </div>
              <p className={cn('mt-3 font-display text-xl font-light', card.accent)}>
                {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              </p>
              {diff != null && (
                <div className="mt-2 flex items-center gap-1">
                  {isUp && <TrendingUp className="h-3 w-3 text-secondary" strokeWidth={1.75} />}
                  {isDown && <TrendingDown className="h-3 w-3 text-error" strokeWidth={1.75} />}
                  <span className={cn('text-label-sm', isUp ? 'text-secondary' : isDown ? 'text-error' : 'text-on-surface-muted')}>
                    {diff > 0 ? '+' : ''}{diff} vs last week
                  </span>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Post totals */}
      {postAnalytics && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Posts', value: postAnalytics.total_posts },
            { label: 'Total Impressions', value: postAnalytics.total_impressions.toLocaleString() },
            { label: 'Total Reactions', value: postAnalytics.total_reactions.toLocaleString() },
            { label: 'Avg Engagement', value: postAnalytics.avg_engagement ? (postAnalytics.avg_engagement * 100).toFixed(2) + '%' : 'N/A' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-6">
              <span className="text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">{stat.label}</span>
              <p className="mt-2 font-display text-lg font-light text-on-surface">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Network Growth</h3>
          <div className="mt-6 h-52">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={glassTooltipStyle} />
                  <Line type="monotone" dataKey="connections" stroke="#06B6D4" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="followers" stroke="#00687A" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-on-surface-muted">
                Analytics will populate after the daily network scrape.
              </div>
            )}
          </div>
          <div className="mt-3 flex justify-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-container" />Connections</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Followers</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Profile Views</h3>
          <div className="mt-6 h-52">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={glassTooltipStyle} />
                  <Bar dataKey="profileViews" fill="#06B6D4" opacity={0.6} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-on-surface-muted">
                No data yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
