import { useQuery } from '@tanstack/react-query'
import { getSessions } from '@/api/claudeCode'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatRelative } from '@/lib/utils'
import type { CCSession } from '@/types/claudeCode'
import { motion } from 'framer-motion'
import { Terminal, DollarSign, Activity } from 'lucide-react'

interface SessionListProps {
  onSelect: (session: CCSession) => void
}

export function SessionList({ onSelect }: SessionListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['ccSessions'],
    queryFn: () => getSessions({ limit: 20 }),
    refetchInterval: 15000,
  })

  if (isLoading) return <LoadingSpinner />

  const sessions = data?.sessions ?? []

  return (
    <div>
      <h3 className="mb-5 text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">
        Recent Decisions
      </h3>

      <div className="space-y-2">
        {sessions.map((session, i) => {
          const isRunning = session.status === 'running' || session.status === 'initializing'
          const isAwaiting = session.status === 'awaiting_input'

          return (
            <motion.button
              key={session.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.04 }}
              onClick={() => onSelect(session)}
              className="group flex w-full items-start gap-4 rounded-2xl px-5 py-4 text-left hover:bg-white/30"
            >
              {/* Icon + status indicator */}
              <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-container-low/60">
                <Terminal className="h-4 w-4 text-on-surface-muted" strokeWidth={1.75} />
                {isRunning && (
                  <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-secondary animate-pulse" />
                )}
                {isAwaiting && (
                  <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-tertiary animate-pulse" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-on-surface line-clamp-1 group-hover:text-primary">
                  {session.initial_prompt}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <StatusBadge status={session.status} />
                  <StatusBadge status={session.triggered_by} />
                  {session.project_name && (
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-muted">
                      {session.project_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Meta */}
              <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <span className="font-mono text-label-sm text-on-surface-muted/40">
                  {formatRelative(session.started_at)}
                </span>
                {session.cc_cost_usd != null && session.cc_cost_usd > 0 && (
                  <span className="flex items-center gap-0.5 font-mono text-label-sm text-on-surface-muted/30">
                    <DollarSign className="h-2.5 w-2.5" strokeWidth={1.75} />
                    {session.cc_cost_usd.toFixed(4)}
                  </span>
                )}
              </div>
            </motion.button>
          )
        })}

        {sessions.length === 0 && (
          <div className="py-16 text-center">
            <Activity className="mx-auto h-6 w-6 text-on-surface-muted/20" strokeWidth={1.5} />
            <p className="mt-4 text-sm text-on-surface-muted/40">
              No autonomous sessions yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
