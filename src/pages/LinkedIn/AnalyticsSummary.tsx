import { useQuery } from '@tanstack/react-query'
import { getNetworkSnapshots, getAnalyticsSummary, getPostAnalytics } from '@/api/linkedin'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import type { NetworkSnapshot } from '@/types/linkedin'
import { Eye, Search, FileText } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

const tooltipStyle = {
  background: 'rgba(255, 255, 255, 0.92)',
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

  const chartData = (snapshots ?? []).map((s: NetworkSnapshot) => ({
    date: new Date(s.snapshot_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
    connections: s.connection_count,
    followers: s.follower_count,
    profileViews: s.profile_views_week,
  }))

  const viewsDiff = (tw.profile_views ?? 0) - (lw.profile_views ?? 0)
  const searchDiff = (tw.search_appearances ?? 0) - (lw.search_appearances ?? 0)

  return (
    <div className="space-y-12 sm:space-y-14">
      {/* Hero: Connections — centered */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 70, damping: 18, mass: 1.2 }}
        className="text-center md:text-right md:pr-8"
      >
        <p className="font-display text-4xl font-light tabular-nums text-primary sm:text-display-lg">
          {(tw.connections ?? 0).toLocaleString()}
        </p>
        <span className="mt-2 block text-label-sm uppercase tracking-[0.08em] text-on-surface-muted/40">
          Connections
        </span>
      </motion.div>

      {/* Whisper stats row — wrap on mobile */}
      <div className="flex flex-wrap gap-4 sm:gap-8 md:gap-10">
        <WhisperStat
          label="Profile Views"
          value={tw.profile_views ?? 0}
          icon={Eye}
          accent="text-primary-container"
          trend={lw.profile_views != null ? { value: viewsDiff, label: 'vs last week' } : undefined}
        />
        <WhisperStat
          label="Search Appearances"
          value={tw.search_appearances ?? 0}
          icon={Search}
          accent="text-tertiary"
          trend={lw.search_appearances != null ? { value: searchDiff, label: 'vs last week' } : undefined}
        />
        <WhisperStat
          label="Posts This Week"
          value={ps.posts_count ?? 0}
          icon={FileText}
          accent="text-secondary"
        />
      </div>

      {/* Post analytics whispers */}
      {postAnalytics && (
        <div className="flex flex-wrap gap-4 sm:gap-8 md:gap-10 md:justify-end">
          <WhisperStat label="Total Posts" value={postAnalytics.total_posts} accent="text-on-surface" />
          <WhisperStat label="Impressions" value={postAnalytics.total_impressions.toLocaleString()} accent="text-primary" />
          <WhisperStat label="Reactions" value={postAnalytics.total_reactions.toLocaleString()} accent="text-secondary" />
          <WhisperStat
            label="Avg Engagement"
            value={postAnalytics.avg_engagement ? (postAnalytics.avg_engagement * 100).toFixed(2) + '%' : 'N/A'}
            accent="text-tertiary"
          />
        </div>
      )}

      {/* Charts — stacked vertically, no glass wrappers */}
      <div className="space-y-12">
        <div>
          <h3 className="mb-6 text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Network Growth</h3>
          <div className="h-52">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
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
          <div className="mt-3 flex gap-4 text-xs text-on-surface-muted/50">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-container" />Connections</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" />Followers</span>
          </div>
        </div>

        <div>
          <h3 className="mb-6 text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Profile Views</h3>
          <div className="h-52">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
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
