import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getVercelStats, getVercelProjects, getVercelDeployments, getDeploymentLogs } from '@/api/vercel'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { VercelDeployment } from '@/types/workspace'
import { formatRelative } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { GitBranch, CheckCircle2, XCircle, Clock, Rocket, ExternalLink, ChevronDown, Terminal } from 'lucide-react'

export function VercelTab() {
  const [expandedDepId, setExpandedDepId] = useState<string | null>(null)

  const { data: stats } = useQuery({ queryKey: ['vercelStats'], queryFn: getVercelStats, staleTime: 30000 })
  const { data: projects } = useQuery({ queryKey: ['vercelProjects'], queryFn: getVercelProjects })
  const { data: deployments } = useQuery({ queryKey: ['vercelDeployments'], queryFn: () => getVercelDeployments({ limit: 20 }) })

  const stateIcon = (state: VercelDeployment['state']) => {
    switch (state) {
      case 'READY': return <CheckCircle2 className="h-4 w-4 text-secondary" />
      case 'ERROR': return <XCircle className="h-4 w-4 text-error" />
      case 'BUILDING': return <Clock className="h-4 w-4 text-tertiary animate-pulse" />
      case 'QUEUED': return <Clock className="h-4 w-4 text-on-surface-muted" />
      default: return <Clock className="h-4 w-4 text-on-surface-muted" />
    }
  }

  return (
    <div>
      {stats && (
        <div className="mb-10 flex flex-wrap items-start gap-4 sm:gap-6">
          <WhisperStat label="Projects" value={String(stats.total_projects)} />
          <WhisperStat label="Total Deploys" value={String(stats.total_deployments)} />
          <WhisperStat label="Deployed (24h)" value={String(stats.deployed_24h)} />
          <WhisperStat label="Failed (24h)" value={String(stats.failed_24h)} accent={stats.failed_24h > 0 ? 'error' : undefined} />
          <WhisperStat label="Building Now" value={String(stats.building_now)} accent={stats.building_now > 0 ? 'tertiary' : undefined} />
        </div>
      )}

      {projects && projects.length > 0 && (
        <div className="mb-12">
          <h3 className="mb-4 text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">Projects</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map(project => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-white/40 p-5 hover:bg-white/55"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{project.name}</p>
                    <p className="text-label-sm text-on-surface-muted">{project.framework || 'No framework'}</p>
                  </div>
                  <Rocket className="h-4 w-4 shrink-0 text-primary/40" />
                </div>
                <div className="mt-3 flex items-center gap-3 text-label-sm text-on-surface-muted">
                  <span>{project.deployment_count} deploys</span>
                  {project.git_repo && <span className="truncate">{project.git_repo}</span>}
                </div>
                {project.production_url && (
                  <a href={project.production_url} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-label-sm text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    {project.production_url.replace('https://', '')}
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {deployments && deployments.length > 0 && (
        <div>
          <h3 className="mb-4 text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">Recent Deployments</h3>
          <div className="space-y-2">
            {deployments.map(dep => (
              <DeploymentRow
                key={dep.id}
                dep={dep}
                stateIcon={stateIcon(dep.state)}
                isExpanded={expandedDepId === dep.id}
                onToggle={() => setExpandedDepId(expandedDepId === dep.id ? null : dep.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Deployment Row - expand to read logs ────────────────────────────
// Logs are observational. You can read what happened. You can't trigger.

function DeploymentRow({
  dep,
  stateIcon,
  isExpanded,
  onToggle,
}: {
  dep: VercelDeployment
  stateIcon: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
}) {
  const { data: logsData, isLoading } = useQuery({
    queryKey: ['vercelLogs', dep.id],
    queryFn: () => getDeploymentLogs(dep.id),
    enabled: isExpanded,
    staleTime: 60000,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl transition-colors ${isExpanded ? 'bg-white/60' : 'bg-white/40 hover:bg-white/50'}`}
    >
      <button onClick={onToggle} className="flex w-full items-center gap-4 px-5 py-3.5 text-left">
        {stateIcon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-on-surface truncate">{dep.project_name || 'Unknown'}</p>
            {dep.target === 'production' && (
              <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-medium uppercase text-secondary">prod</span>
            )}
          </div>
          <p className="text-label-sm text-on-surface-muted truncate">
            {dep.git_commit_message || dep.git_branch || 'No commit info'}
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-0.5">
          {dep.git_branch && (
            <span className="flex items-center gap-1 text-label-sm text-on-surface-muted">
              <GitBranch className="h-3 w-3" />{dep.git_branch}
            </span>
          )}
          <span className="text-label-sm text-on-surface-muted">{formatRelative(dep.created_at)}</span>
        </div>
        <StatusBadge status={dep.state} />
        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}>
          <ChevronDown className="h-4 w-4 text-on-surface-muted/40" strokeWidth={1.75} />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24 }}
            className="overflow-hidden"
          >
            <div className="border-t border-on-surface-muted/8 px-5 pb-5 pt-4">
              <div className="mb-3 flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5 text-on-surface-muted/40" strokeWidth={1.75} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-muted/30">Build Log</span>
              </div>
              {isLoading ? (
                <p className="font-mono text-xs text-on-surface-muted/30">Reading log...</p>
              ) : logsData?.logs && logsData.logs.length > 0 ? (
                <div className="max-h-64 overflow-y-auto rounded-xl bg-[#0B0F14]/90 px-4 py-3 font-mono text-xs text-on-surface-muted/50 leading-relaxed">
                  {logsData.logs.map((line, i) => (
                    <div key={i} className="whitespace-pre-wrap break-all">{line}</div>
                  ))}
                </div>
              ) : (
                <p className="font-mono text-xs text-on-surface-muted/30">No log data for this deployment.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
