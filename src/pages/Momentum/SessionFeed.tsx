import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatRelative } from '@/lib/utils'
import type { MomentumSession } from '@/api/momentum'
import { CheckCircle2, XCircle, Rocket, Clock, Loader2 } from 'lucide-react'
import { GlassPanel } from '@/components/spatial/GlassPanel'

interface Props {
  sessions: MomentumSession[]
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; label: string }> = {
  complete: { icon: CheckCircle2, color: 'text-secondary', label: 'Complete' },
  error: { icon: XCircle, color: 'text-error', label: 'Error' },
  running: { icon: Loader2, color: 'text-gold', label: 'Running' },
  paused: { icon: Clock, color: 'text-on-surface-muted/50', label: 'Paused' },
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${Math.round(seconds / 3600)}h`
}

export function SessionFeed({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="py-12 text-center text-on-surface-muted/40">
        No sessions this week
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sessions.map((s, i) => {
        const config = STATUS_CONFIG[s.status] || STATUS_CONFIG.paused
        const Icon = config.icon
        const deployed = s.deployStatus === 'deployed'

        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03, type: 'spring', stiffness: 80, damping: 18 }}
          >
            <GlassPanel depth="surface" className="px-4 py-3">
              <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className="mt-0.5 shrink-0">
                  <Icon
                    className={cn('h-4 w-4', config.color, s.status === 'running' && 'animate-spin')}
                    strokeWidth={1.75}
                  />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-on-surface/80 line-clamp-2">
                    {s.prompt || 'Untitled session'}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-label-sm text-on-surface-muted/40">
                    {s.stream && (
                      <span className="capitalize">{s.stream}</span>
                    )}
                    {s.durationSeconds > 0 && (
                      <span className="font-mono">{formatDuration(s.durationSeconds)}</span>
                    )}
                    {s.filesChanged > 0 && (
                      <span className="text-secondary/70">{s.filesChanged} files</span>
                    )}
                    {deployed && (
                      <span className="flex items-center gap-1 text-secondary">
                        <Rocket className="h-3 w-3" strokeWidth={1.75} />
                        deployed
                      </span>
                    )}
                    {s.confidence != null && (
                      <span className="font-mono">{Math.round(s.confidence * 100)}%</span>
                    )}
                    <span>{formatRelative(s.startedAt)}</span>
                  </div>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        )
      })}
    </div>
  )
}
