import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWorkerStatus, resumeWorker, triggerJob, getWorkerLogs, setSessionCookie } from '@/api/linkedin'
import type { LinkedInWorkerStatus } from '@/types/linkedin'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatRelative } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ScrapeLog } from '@/types/linkedin'
import toast from 'react-hot-toast'
import { Key, Play, RefreshCw, Shield, Wifi, WifiOff } from 'lucide-react'

const JOB_TYPES = [
  { key: 'dms', label: 'DM Check', schedule: 'Every 4 hours' },
  { key: 'posts', label: 'Post Publish', schedule: 'Every 30 min' },
  { key: 'connections', label: 'Connections', schedule: 'Daily 8am' },
  { key: 'network_stats', label: 'Network Stats', schedule: 'Daily 11pm' },
  { key: 'post_performance', label: 'Post Performance', schedule: 'Daily 7am' },
]

export function LinkedInSettings() {
  const [cookie, setCookie] = useState('')
  const queryClient = useQueryClient()

  const { data: status, isLoading: loadingStatus } = useQuery<LinkedInWorkerStatus>({
    queryKey: ['linkedinWorkerStatus'],
    queryFn: getWorkerStatus,
    refetchInterval: 15000,
  })

  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ['linkedinWorkerLogs'],
    queryFn: () => getWorkerLogs(20),
  })

  const resume = useMutation({
    mutationFn: resumeWorker,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['linkedinWorkerStatus'] }); toast.success('Worker resumed') },
  })

  const trigger = useMutation({
    mutationFn: triggerJob,
    onSuccess: (_, jobType) => { toast.success(`${jobType} triggered`); queryClient.invalidateQueries({ queryKey: ['linkedinWorkerLogs'] }) },
    onError: (e) => toast.error(`Failed: ${(e as Error).message}`),
  })

  const saveCookie = useMutation({
    mutationFn: () => setSessionCookie(cookie),
    onSuccess: () => { setCookie(''); queryClient.invalidateQueries({ queryKey: ['linkedinWorkerStatus'] }); toast.success('Cookie saved') },
    onError: () => toast.error('Failed to save cookie'),
  })

  if (loadingStatus) return <LoadingSpinner />

  const isActive = status?.status === 'active' || status?.status === 'inactive'

  return (
    <div className="space-y-8">
      {/* Session status */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isActive ? (
              <div className="relative">
                <Wifi className="h-5 w-5 text-secondary" strokeWidth={1.75} />
                <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-secondary animate-pulse-glow" />
              </div>
            ) : (
              <WifiOff className="h-5 w-5 text-error" strokeWidth={1.75} />
            )}
            <div>
              <h3 className="font-display text-sm font-medium text-on-surface">Session Status</h3>
              <p className="text-xs text-on-surface-muted">
                {status?.status === 'active' && 'Connected'}
                {status?.status === 'inactive' && 'Cookie set, ready to connect'}
                {status?.status === 'suspended' && `Suspended: ${status.reason}`}
                {status?.status === 'captcha' && `CAPTCHA detected: ${status.reason}`}
              </p>
            </div>
          </div>
          {(status?.status === 'suspended' || status?.status === 'captcha') && (
            <button
              onClick={() => resume.mutate()}
              disabled={resume.isPending}
              className="flex items-center gap-2 rounded-xl bg-secondary/10 px-4 py-2.5 text-sm text-secondary transition-colors hover:bg-secondary/20"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} /> Resume
            </button>
          )}
        </div>
        {status?.lastActive && (
          <p className="mt-3 font-mono text-label-sm text-on-surface-muted">Last active: {formatRelative(status.lastActive)}</p>
        )}
      </div>

      {/* Cookie input */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-on-surface-muted" strokeWidth={1.75} />
          <h3 className="font-display text-sm font-medium text-on-surface">LinkedIn Cookie (li_at)</h3>
        </div>
        <p className="mt-2 text-xs text-on-surface-muted">
          Get this from your browser: LinkedIn.com &rarr; Developer Tools &rarr; Application &rarr; Cookies &rarr; li_at
        </p>
        <div className="mt-4 flex gap-2">
          <input
            type="password"
            value={cookie}
            onChange={(e) => setCookie(e.target.value)}
            placeholder="Paste li_at cookie value..."
            className="flex-1 rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface placeholder-on-surface-muted transition-colors focus:bg-surface-container-lowest focus:outline-none"
          />
          <button
            onClick={() => saveCookie.mutate()}
            disabled={!cookie.trim() || saveCookie.isPending}
            className="rounded-xl bg-surface-container-high px-5 py-3 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>

      {/* Budget usage */}
      {status?.budgetUsage && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-on-surface-muted" strokeWidth={1.75} />
            <h3 className="font-display text-sm font-medium text-on-surface">Daily Budget Usage</h3>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {Object.entries(status.budgetUsage).map(([key, budget]) => (
              <div key={key} className="rounded-xl bg-surface-container-low p-4">
                <div className="flex items-center justify-between">
                  <span className="text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">{key.replace(/_/g, ' ')}</span>
                  <span className="font-mono text-label-sm text-on-surface-muted">{budget.used}/{budget.limit}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-container">
                  <div
                    className={cn('h-full rounded-full transition-all',
                      budget.remaining === 0 ? 'bg-error' :
                      budget.remaining < budget.limit * 0.2 ? 'bg-tertiary' : 'bg-secondary',
                    )}
                    style={{ width: `${(budget.used / budget.limit) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 font-mono text-label-sm text-on-surface-muted">
            Sessions today: {status.sessionsToday}/{status.maxSessionsPerDay}
          </p>
        </div>
      )}

      {/* Manual triggers */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-display text-sm font-medium text-on-surface">Manual Triggers</h3>
        <p className="mt-1 text-xs text-on-surface-muted">Run a scrape job manually. Jobs run in the background.</p>
        <div className="mt-4 grid grid-cols-5 gap-3">
          {JOB_TYPES.map((job) => (
            <button
              key={job.key}
              onClick={() => trigger.mutate(job.key)}
              disabled={trigger.isPending || !isActive}
              className="flex flex-col items-center gap-2 rounded-2xl bg-surface-container-low p-4 text-center transition-colors hover:bg-surface-container disabled:opacity-40"
            >
              <Play className="h-4 w-4 text-on-surface-muted" strokeWidth={1.75} />
              <span className="text-xs font-medium text-on-surface-variant">{job.label}</span>
              <span className="font-mono text-label-sm text-on-surface-muted">{job.schedule}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrape logs */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-display text-sm font-medium text-on-surface">Recent Scrape Logs</h3>
        {loadingLogs ? <LoadingSpinner /> : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">
                  <th className="px-3 py-3 text-left">Job</th>
                  <th className="px-3 py-3 text-left">Status</th>
                  <th className="px-3 py-3 text-left">Items</th>
                  <th className="px-3 py-3 text-left">Duration</th>
                  <th className="px-3 py-3 text-left">Time</th>
                  <th className="px-3 py-3 text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {(logs ?? []).map((log: ScrapeLog, i: number) => (
                  <tr key={log.id} className={i % 2 === 0 ? 'bg-transparent' : 'bg-surface-container-low/40'}>
                    <td className="px-3 py-3 text-on-surface-variant">{log.job_type}</td>
                    <td className="px-3 py-3"><StatusBadge status={log.status} /></td>
                    <td className="px-3 py-3 font-mono text-on-surface-muted">{log.items_found}</td>
                    <td className="px-3 py-3 font-mono text-on-surface-muted">{log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '\u2014'}</td>
                    <td className="px-3 py-3 font-mono text-on-surface-muted">{formatRelative(log.created_at)}</td>
                    <td className="px-3 py-3 text-error/70 truncate max-w-[200px]">{log.error_message || '\u2014'}</td>
                  </tr>
                ))}
                {(logs ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-on-surface-muted">No logs yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
