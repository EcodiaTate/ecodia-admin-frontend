import { motion } from 'framer-motion'
import type { TimelinePoint } from '@/api/momentum'

interface Props {
  data: TimelinePoint[]
}

export function ActivityTimeline({ data }: Props) {
  if (data.length === 0) return null

  const maxSessions = Math.max(...data.map(d => d.sessions), 1)

  return (
    <div className="flex items-end gap-[2px]" style={{ height: 80 }}>
      {data.map((point, i) => {
        const height = (point.sessions / maxSessions) * 100
        const hasErrors = point.errors > 0
        const allComplete = point.sessions > 0 && point.complete === point.sessions
        const hour = new Date(point.hour)
        const isNow = i === data.length - 1

        return (
          <motion.div
            key={point.hour}
            className="group relative flex-1"
            style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}
          >
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max(height, 4)}%` }}
              transition={{ type: 'spring', stiffness: 50, damping: 12, delay: i * 0.01 }}
              className={`w-full rounded-t-sm ${
                hasErrors
                  ? 'bg-error/40'
                  : allComplete
                    ? 'bg-secondary/50'
                    : point.sessions > 0
                      ? 'bg-primary/30'
                      : 'bg-white/10'
              } ${isNow ? 'ring-1 ring-gold/30' : ''}`}
            />
            {/* Tooltip on hover */}
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-surface/90 px-2.5 py-1.5 text-label-sm shadow-lg backdrop-blur group-hover:block">
              <p className="font-mono text-on-surface/80">
                {hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-on-surface-muted/60">
                {point.sessions} session{point.sessions !== 1 ? 's' : ''}
                {point.complete > 0 && ` · ${point.complete} ok`}
                {point.errors > 0 && ` · ${point.errors} err`}
              </p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
