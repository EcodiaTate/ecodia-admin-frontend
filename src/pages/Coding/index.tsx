import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCodingDashboard, getCodeRequests, getSessions, confirmCodeRequest, rejectCodeRequest } from '@/api/factory'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatRelative } from '@/lib/utils'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Code2, Inbox, Activity, Rocket, ChevronRight, Clock, CheckCircle2, XCircle,
  Pause, Play, AlertTriangle, Check, X, Loader2,
} from 'lucide-react'

const STATUS_ICON: Record<string, typeof Activity> = {
  running: Activity,
  initializing: Play,
  completing: Loader2,
  queued: Clock,
  complete: CheckCircle2,
  error: XCircle,
  paused: Pause,
  stopped: XCircle,
}

const STATUS_COLOR: Record<string, string> = {
  running: 'text-green-600',
  initializing: 'text-blue-500',
  completing: 'text-blue-400',
  queued: 'text-amber-500',
  complete: 'text-gray-500',
  error: 'text-red-500',
  paused: 'text-amber-500',
  stopped: 'text-gray-400',
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
  const queryClient = useQueryClient()

  const { data: dashboard, isLoading: dashLoading, isError: dashError } = useQuery({
    queryKey: ['codingDashboard'],
    queryFn: getCodingDashboard,
    refetchInterval: 15000,
  })

  const { data: requests, isError: requestsError } = useQuery({
    queryKey: ['codeRequests', 'pending'],
    queryFn: () => getCodeRequests('pending'),
    refetchInterval: 30000,
  })

  const { data: activeSessions, isError: sessionsError } = useQuery({
    queryKey: ['ccSessions', 'running'],
    queryFn: () => getSessions({ status: 'running', limit: 10 }),
    refetchInterval: 10000,
  })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmCodeRequest(id),
    onSuccess: () => {
      toast.success('Code request confirmed — session dispatched')
      queryClient.invalidateQueries({ queryKey: ['codeRequests'] })
      queryClient.invalidateQueries({ queryKey: ['codingDashboard'] })
      queryClient.invalidateQueries({ queryKey: ['ccSessions'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to confirm')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectCodeRequest(id, 'Rejected from coding dashboard'),
    onSuccess: () => {
      toast.success('Code request rejected')
      queryClient.invalidateQueries({ queryKey: ['codeRequests'] })
      queryClient.invalidateQueries({ queryKey: ['codingDashboard'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to reject')
    },
  })

  if (dashLoading) return <LoadingSpinner />

  const pending = requests?.requests ?? []
  const running = activeSessions?.sessions ?? []
  const stuckCount = dashboard?.stuckRequests ?? 0
  const hasErrors = dashError || requestsError || sessionsError

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

      {/* Error banner */}
      {hasErrors && (
        <SpatialLayer z={22} className="mb-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Some data failed to load. Auto-retrying...</span>
          </div>
        </SpatialLayer>
      )}

      {/* WhisperStats */}
      <SpatialLayer z={20} className="grid grid-cols-2 gap-6 sm:grid-cols-5 mb-12">
        <WhisperStat label="Active" value={dashboard?.activeSessions ?? 0} icon={Activity} />
        <WhisperStat label="Pending" value={dashboard?.pendingRequests ?? 0} icon={Inbox} />
        <WhisperStat label="Completed (24h)" value={dashboard?.todayCompletions ?? 0} icon={CheckCircle2} />
        <WhisperStat label="Codebases" value={dashboard?.codebases?.length ?? 0} icon={Code2} />
        {stuckCount > 0 && (
          <WhisperStat label="Stuck" value={stuckCount} icon={AlertTriangle} />
        )}
      </SpatialLayer>

      {/* Stuck requests alert */}
      {stuckCount > 0 && (
        <SpatialLayer z={18} className="mb-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{stuckCount} code request{stuckCount > 1 ? 's' : ''} stuck without a session. Ask Cortex to recover.</span>
          </div>
        </SpatialLayer>
      )}

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
                  <Link
                    key={s.id}
                    to={`/factory-dev?session=${s.id}`}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/40 transition-colors cursor-pointer"
                  >
                    <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-on-surface/80 truncate">{s.initial_prompt?.slice(0, 80)}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-on-surface-muted/60">
                          {PIPELINE_LABELS[s.pipeline_stage] || s.pipeline_stage}
                        </span>
                        {s.codebase_name && <span className="text-[10px] text-primary/60">{s.codebase_name}</span>}
                        {s.client_name && <span className="text-[10px] text-on-surface-muted/50">{s.client_name}</span>}
                        {s.triggered_by && s.triggered_by !== 'manual' && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-white/20 text-on-surface-muted/50">{s.triggered_by}</span>
                        )}
                      </div>
                    </div>
                    {s.confidence_score != null && (
                      <span className="text-[10px] font-mono text-on-surface-muted/50">
                        {(s.confidence_score * 100).toFixed(0)}%
                      </span>
                    )}
                    <ChevronRight className="w-3 h-3 text-on-surface-muted/30" />
                  </Link>
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
            </div>
            <div className="space-y-2">
              {pending.map((r: any) => {
                const isActing = confirmMutation.isPending || rejectMutation.isPending
                return (
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
                        {r.codebase_name && (
                          <span className="text-[10px] text-primary/50">{r.codebase_name}</span>
                        )}
                        {r.confidence != null && (
                          <span className="text-[10px] font-mono text-on-surface-muted/40">
                            {(r.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                        {r.last_error && (
                          <span className="text-[10px] text-red-400" title={r.last_error}>failed</span>
                        )}
                      </div>
                    </div>
                    {/* Confirm / Reject buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => confirmMutation.mutate(r.id)}
                        disabled={isActing}
                        className="p-1 rounded hover:bg-green-500/10 text-green-500/60 hover:text-green-500 transition-colors disabled:opacity-30"
                        title="Confirm & dispatch"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => rejectMutation.mutate(r.id)}
                        disabled={isActing}
                        className="p-1 rounded hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-30"
                        title="Reject"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
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
                <Link
                  key={s.id}
                  to={`/factory-dev?session=${s.id}`}
                  className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Icon className={`w-3 h-3 ${color} flex-shrink-0`} />
                  <p className="flex-1 text-[11px] text-on-surface/70 truncate">{s.initial_prompt?.slice(0, 70)}</p>
                  {s.client_name && (
                    <span className="text-[10px] text-on-surface-muted/40">{s.client_name}</span>
                  )}
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
                </Link>
              )
            })}
            {(dashboard?.recentSessions ?? []).length === 0 && (
              <p className="text-xs text-on-surface-muted/40 py-4 text-center">No sessions yet</p>
            )}
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
            {(dashboard?.codebases ?? []).length === 0 && (
              <p className="col-span-full text-xs text-on-surface-muted/40 py-4 text-center">No codebases registered</p>
            )}
          </div>
        </GlassPanel>
      </SpatialLayer>
    </div>
  )
}
