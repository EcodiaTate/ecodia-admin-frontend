import { useQuery } from '@tanstack/react-query'
import { getCodingDashboard, getCodeRequests, getSessions } from '@/api/factory'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatRelative } from '@/lib/utils'
import { Code2, Inbox, Activity, Rocket, ChevronRight, Clock, CheckCircle2, XCircle, Pause, Play } from 'lucide-react'

const STATUS_ICON: Record<string, typeof Activity> = {
  running: Activity,
  initializing: Play,
  complete: CheckCircle2,
  error: XCircle,
  paused: Pause,
}

const STATUS_COLOR: Record<string, string> = {
  running: 'text-green-600',
  initializing: 'text-blue-500',
  complete: 'text-gray-500',
  error: 'text-red-500',
  paused: 'text-amber-500',
}

const PIPELINE_LABELS: Record<string, string> = {
  queued: 'Queued',
  context: 'Building context',
  executing: 'Executing',
  testing: 'Testing',
  reviewing: 'Reviewing',
  deploying: 'Deploying',
  deployed: 'Deployed',
  complete: 'Complete',
  failed: 'Failed',
}

export default function CodingPage() {
  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['codingDashboard'],
    queryFn: getCodingDashboard,
    refetchInterval: 15000,
  })

  const { data: requests } = useQuery({
    queryKey: ['codeRequests', 'pending'],
    queryFn: () => getCodeRequests('pending'),
    refetchInterval: 30000,
  })

  const { data: activeSessions } = useQuery({
    queryKey: ['ccSessions', 'running'],
    queryFn: () => getSessions({ status: 'running', limit: 10 }),
    refetchInterval: 10000,
  })

  if (dashLoading) return <LoadingSpinner />

  const pending = requests?.requests ?? []
  const running = activeSessions?.sessions ?? []

  return (
    <div className="mx-auto max-w-4xl">
      <SpatialLayer z={25} className="mb-14">
        <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted/60">
          Auto-Developer
        </span>
        <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
          Coding <em className="not-italic font-normal text-green-500">Engine</em>
        </h1>
      </SpatialLayer>

      {/* WhisperStats */}
      <SpatialLayer z={20} className="grid grid-cols-2 gap-6 sm:grid-cols-4 mb-12">
        <WhisperStat label="Active" value={dashboard?.activeSessions ?? 0} icon={Activity} />
        <WhisperStat label="Pending" value={dashboard?.pendingRequests ?? 0} icon={Inbox} />
        <WhisperStat label="Completed (24h)" value={dashboard?.todayCompletions ?? 0} icon={CheckCircle2} />
        <WhisperStat label="Codebases" value={dashboard?.codebases?.length ?? 0} icon={Code2} />
      </SpatialLayer>

      {/* Active Sessions */}
      {running.length > 0 && (
        <SpatialLayer z={15} className="mb-8">
          <GlassPanel>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-green-500" />
              <h2 className="text-sm font-medium text-on-surface/80">Active Sessions</h2>
            </div>
            <div className="space-y-2">
              {running.map((s: any) => {
                const Icon = STATUS_ICON[s.status] ?? Activity
                const color = STATUS_COLOR[s.status] ?? 'text-gray-500'
                return (
                  <div key={s.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/40 transition-colors">
                    <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-on-surface/80 truncate">{s.initial_prompt?.slice(0, 80)}</p>
                      <p className="text-[10px] text-on-surface-muted/60 mt-0.5">
                        {PIPELINE_LABELS[s.pipeline_stage] || s.pipeline_stage}
                        {s.codebase_name && <span className="ml-2 text-primary/60">{s.codebase_name}</span>}
                      </p>
                    </div>
                    {s.confidence_score != null && (
                      <span className="text-[10px] font-mono text-on-surface-muted/50">
                        {(s.confidence_score * 100).toFixed(0)}%
                      </span>
                    )}
                    <ChevronRight className="w-3 h-3 text-on-surface-muted/30" />
                  </div>
                )
              })}
            </div>
          </GlassPanel>
        </SpatialLayer>
      )}

      {/* Pending Code Requests */}
      {pending.length > 0 && (
        <SpatialLayer z={12} className="mb-8">
          <GlassPanel>
            <div className="flex items-center gap-2 mb-4">
              <Inbox className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-medium text-on-surface/80">Pending Code Requests</h2>
              <span className="ml-auto text-[10px] text-on-surface-muted/50">Tell Cortex to confirm or reject</span>
            </div>
            <div className="space-y-2">
              {pending.map((r: any) => (
                <div key={r.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/40 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-on-surface/80 truncate">{r.summary}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-on-surface-muted/50">{r.source}</span>
                      {r.code_work_type && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-primary/5 text-primary/60 rounded">{r.code_work_type}</span>
                      )}
                      {r.client_name && (
                        <span className="text-[10px] text-on-surface-muted/50">{r.client_name}</span>
                      )}
                      {r.confidence != null && (
                        <span className="text-[10px] font-mono text-on-surface-muted/40">
                          {(r.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <Clock className="w-3 h-3 text-on-surface-muted/30" />
                </div>
              ))}
            </div>
          </GlassPanel>
        </SpatialLayer>
      )}

      {/* Recent Sessions */}
      <SpatialLayer z={10} className="mb-8">
        <GlassPanel>
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-4 h-4 text-primary/60" />
            <h2 className="text-sm font-medium text-on-surface/80">Recent Sessions</h2>
          </div>
          <div className="space-y-1">
            {(dashboard?.recentSessions ?? []).map((s: any) => {
              const Icon = STATUS_ICON[s.status] ?? Activity
              const color = STATUS_COLOR[s.status] ?? 'text-gray-500'
              return (
                <div key={s.id} className="flex items-center gap-3 py-1.5 px-3 rounded-lg">
                  <Icon className={`w-3 h-3 ${color} flex-shrink-0`} />
                  <p className="flex-1 text-[11px] text-on-surface/70 truncate">{s.initial_prompt?.slice(0, 70)}</p>
                  <span className="text-[10px] text-on-surface-muted/40 font-mono">
                    {s.triggered_by}
                  </span>
                  {s.confidence_score != null && (
                    <span className="text-[10px] font-mono text-on-surface-muted/40">
                      {(s.confidence_score * 100).toFixed(0)}%
                    </span>
                  )}
                  <span className="text-[10px] text-on-surface-muted/40">
                    {s.started_at ? formatRelative(s.started_at) : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </GlassPanel>
      </SpatialLayer>

      {/* Codebases */}
      <SpatialLayer z={8}>
        <GlassPanel>
          <div className="flex items-center gap-2 mb-4">
            <Code2 className="w-4 h-4 text-on-surface-muted/50" />
            <h2 className="text-sm font-medium text-on-surface/80">Registered Codebases</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(dashboard?.codebases ?? []).map((cb: any) => (
              <div key={cb.id} className="py-2 px-3 rounded-lg bg-white/20">
                <p className="text-xs font-medium text-on-surface/80">{cb.name}</p>
                <p className="text-[10px] text-on-surface-muted/50 mt-0.5">{cb.language || 'unknown'}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      </SpatialLayer>
    </div>
  )
}
