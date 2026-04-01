import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWorkerStatus, resumeWorker, triggerJob, getWorkerLogs, setSessionCookie } from '@/api/linkedin'
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

  const { data: status, isLoading: loadingStatus } = useQuery({
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
    <div className="space-y-6">
      {/* Session status */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isActive ? <Wifi className="h-5 w-5 text-green-400" /> : <WifiOff className="h-5 w-5 text-red-400" />}
            <div>
              <h3 className="text-sm font-medium text-zinc-200">Session Status</h3>
              <p className="text-xs text-zinc-500">
                {status?.status === 'active' && 'Connected'}
                {status?.status === 'inactive' && 'Cookie set, ready to connect'}
                {status?.status === 'suspended' && `Suspended: ${status.reason}`}
                {status?.status === 'captcha' && `CAPTCHA detected: ${status.reason}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {(status?.status === 'suspended' || status?.status === 'captcha') && (
              <button
                onClick={() => resume.mutate()}
                disabled={resume.isPending}
                className="flex items-center gap-1.5 rounded-md bg-emerald-600/20 px-3 py-1.5 text-sm text-emerald-400 hover:bg-emerald-600/30"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Resume
              </button>
            )}
          </div>
        </div>

        {status?.lastActive && (
          <p className="mt-2 text-xs text-zinc-500">Last active: {formatRelative(status.lastActive)}</p>
        )}
      </div>

      {/* Cookie input */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-zinc-400" />
          <h3 className="text-sm font-medium text-zinc-200">LinkedIn Cookie (li_at)</h3>
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          Get this from your browser: LinkedIn.com &rarr; Developer Tools &rarr; Application &rarr; Cookies &rarr; li_at
        </p>
        <div className="mt-3 flex gap-2">
          <input
            type="password"
            value={cookie}
            onChange={(e) => setCookie(e.target.value)}
            placeholder="Paste li_at cookie value..."
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 placeholder-zinc-500 outline-none"
          />
          <button
            onClick={() => saveCookie.mutate()}
            disabled={!cookie.trim() || saveCookie.isPending}
            className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      {/* Budget usage */}
      {status?.budgetUsage && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-zinc-400" />
            <h3 className="text-sm font-medium text-zinc-200">Daily Budget Usage</h3>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {Object.entries(status.budgetUsage).map(([key, budget]) => (
              <div key={key} className="rounded bg-zinc-800/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{key.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-zinc-500">{budget.used}/{budget.limit}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-700">
                  <div
                    className={cn('h-full rounded-full',
                      budget.remaining === 0 ? 'bg-red-400' :
                      budget.remaining < budget.limit * 0.2 ? 'bg-yellow-400' : 'bg-emerald-400'
                    )}
                    style={{ width: `${(budget.used / budget.limit) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Sessions today: {status.sessionsToday}/{status.maxSessionsPerDay}
          </p>
        </div>
      )}

      {/* Manual triggers */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="text-sm font-medium text-zinc-200">Manual Triggers</h3>
        <p className="mt-1 text-xs text-zinc-500">Run a scrape job manually. Jobs run in the background.</p>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {JOB_TYPES.map((job) => (
            <button
              key={job.key}
              onClick={() => trigger.mutate(job.key)}
              disabled={trigger.isPending || !isActive}
              className="flex flex-col items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-800/30 p-3 text-center transition-colors hover:bg-zinc-800/60 disabled:opacity-50"
            >
              <Play className="h-4 w-4 text-zinc-400" />
              <span className="text-xs font-medium text-zinc-300">{job.label}</span>
              <span className="text-[10px] text-zinc-500">{job.schedule}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Scrape logs */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="text-sm font-medium text-zinc-200">Recent Scrape Logs</h3>
        {loadingLogs ? <LoadingSpinner /> : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="px-2 py-2 text-left">Job</th>
                  <th className="px-2 py-2 text-left">Status</th>
                  <th className="px-2 py-2 text-left">Items</th>
                  <th className="px-2 py-2 text-left">Duration</th>
                  <th className="px-2 py-2 text-left">Time</th>
                  <th className="px-2 py-2 text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {(logs ?? []).map((log: ScrapeLog) => (
                  <tr key={log.id} className="border-b border-zinc-800/30">
                    <td className="px-2 py-2 text-zinc-300">{log.job_type}</td>
                    <td className="px-2 py-2"><StatusBadge status={log.status} /></td>
                    <td className="px-2 py-2 text-zinc-400">{log.items_found}</td>
                    <td className="px-2 py-2 text-zinc-400">{log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '-'}</td>
                    <td className="px-2 py-2 text-zinc-500">{formatRelative(log.created_at)}</td>
                    <td className="px-2 py-2 text-red-400/70 truncate max-w-[200px]">{log.error_message || '-'}</td>
                  </tr>
                ))}
                {(logs ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-center text-zinc-500">No logs yet</td>
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
