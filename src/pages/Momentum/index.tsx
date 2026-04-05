import { useQuery } from '@tanstack/react-query'
import { getMomentum } from '@/api/momentum'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { motion } from 'framer-motion'
import { formatRelative } from '@/lib/utils'
import {
  Flame, GitCommit, FileCode, Rocket, CheckCircle2,
  Brain, Eye, Wrench, Sparkles, Clock, Cpu, HardDrive, Heart,
  RefreshCw, Gauge,
} from 'lucide-react'
import { ActivityTimeline } from './ActivityTimeline'
import { SessionFeed } from './SessionFeed'

const STREAM_ICONS: Record<string, typeof Brain> = {
  reflection: Brain,
  perception: Eye,
  maintenance: Wrench,
  exploration: Sparkles,
}

export default function MomentumPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['momentum'],
    queryFn: getMomentum,
    refetchInterval: 60_000,
  })

  if (isLoading || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="font-display text-lg text-on-surface-muted/40"
        >
          Reading momentum...
        </motion.div>
      </div>
    )
  }

  const { summary, streams, goals, gitActivity, percepts } = data

  return (
    <div className="mx-auto max-w-4xl pb-24">
      {/* Hero stat — sessions completed this week */}
      <SpatialLayer z={25} className="flex flex-col items-center pt-[6vh]">
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 60, damping: 18, mass: 1.4 }}
          className="font-display text-7xl font-bold tabular-nums tracking-tight text-on-surface sm:text-[6rem]"
        >
          {summary.complete}
        </motion.p>
        <span className="mt-3 text-label-sm uppercase tracking-[0.15em] text-on-surface-muted/50">
          Sessions completed this week
        </span>

        {summary.successRate != null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex items-center gap-6 text-on-surface-muted/50"
          >
            <div className="flex items-center gap-1.5">
              <Flame className="h-3 w-3 text-gold" strokeWidth={2} />
              <span className="font-mono text-label-sm">{summary.successRate}% success</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Rocket className="h-3 w-3 text-secondary" strokeWidth={2} />
              <span className="font-mono text-label-sm">{summary.deployed} deployed</span>
            </div>
          </motion.div>
        )}
      </SpatialLayer>

      {/* Summary stats row */}
      <SpatialLayer z={18} className="mt-10">
        <GlassPanel depth="surface" className="mx-auto max-w-2xl px-2 py-3">
          <div className="grid grid-cols-2 gap-0 sm:grid-cols-4">
            <WhisperStat
              label="Files changed"
              value={summary.filesChanged}
              icon={FileCode}
              accent="text-secondary"
            />
            <WhisperStat
              label="Commits"
              value={summary.commits7d}
              icon={GitCommit}
              accent="text-on-surface"
            />
            <WhisperStat
              label="Actions done"
              value={summary.actionsExecuted7d}
              icon={CheckCircle2}
              accent="text-gold"
            />
            <WhisperStat
              label="Total sessions"
              value={summary.sessions7d}
              icon={Clock}
              accent="text-tertiary"
            />
          </div>
        </GlassPanel>
      </SpatialLayer>

      {/* System health */}
      {data.health && (
        <SpatialLayer z={15} className="mt-8">
          <GlassPanel depth="elevated" className="px-6 py-5">
            <h2 className="mb-4 text-label-sm uppercase tracking-[0.1em] text-on-surface-muted/60">
              System health
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {/* CPU */}
              <div className="flex items-center gap-3">
                <Cpu className="h-4 w-4 shrink-0 text-on-surface-muted/40" strokeWidth={1.5} />
                <div>
                  <p className="font-mono text-lg font-light tabular-nums text-on-surface">
                    {data.health.ecodiaos.cpu != null ? `${Math.round(data.health.ecodiaos.cpu)}%` : '—'}
                  </p>
                  <p className="text-label-sm text-on-surface-muted/40">CPU</p>
                </div>
              </div>
              {/* Memory */}
              <div className="flex items-center gap-3">
                <HardDrive className="h-4 w-4 shrink-0 text-on-surface-muted/40" strokeWidth={1.5} />
                <div>
                  <p className="font-mono text-lg font-light tabular-nums text-on-surface">
                    {data.health.ecodiaos.memory
                      ? `${data.health.ecodiaos.memory.heapUsed}/${data.health.ecodiaos.memory.heapTotal}MB`
                      : '—'}
                  </p>
                  <p className="text-label-sm text-on-surface-muted/40">Heap</p>
                </div>
              </div>
              {/* Event loop lag */}
              <div className="flex items-center gap-3">
                <Gauge className="h-4 w-4 shrink-0 text-on-surface-muted/40" strokeWidth={1.5} />
                <div>
                  <p className="font-mono text-lg font-light tabular-nums text-on-surface">
                    {data.health.ecodiaos.eventLoopLagMs != null
                      ? `${Math.round(data.health.ecodiaos.eventLoopLagMs)}ms`
                      : '—'}
                  </p>
                  <p className="text-label-sm text-on-surface-muted/40">Event loop</p>
                </div>
              </div>
              {/* Organism */}
              <div className="flex items-center gap-3">
                <Heart
                  className={`h-4 w-4 shrink-0 ${
                    data.health.organism.healthy === true
                      ? 'text-secondary'
                      : data.health.organism.healthy === false
                        ? 'text-error'
                        : 'text-on-surface-muted/30'
                  }`}
                  strokeWidth={1.5}
                  fill={data.health.organism.healthy === true ? 'currentColor' : 'none'}
                />
                <div>
                  <p className="font-mono text-lg font-light tabular-nums text-on-surface">
                    {data.health.organism.healthy === true
                      ? `${data.health.organism.lastResponseMs ?? '—'}ms`
                      : data.health.organism.healthy === false
                        ? 'Down'
                        : '—'}
                  </p>
                  <p className="text-label-sm text-on-surface-muted/40">Organism</p>
                </div>
              </div>
            </div>

            {/* PM2 processes */}
            {data.health.ecodiaos.pm2Processes.length > 0 && (
              <div className="mt-4 border-t border-white/5 pt-4">
                <div className="flex flex-wrap gap-3">
                  {data.health.ecodiaos.pm2Processes.map((p) => (
                    <div
                      key={p.name}
                      className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5"
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full ${
                          p.status === 'online' ? 'bg-secondary' : 'bg-error'
                        }`}
                      />
                      <span className="text-label-sm text-on-surface/60">{p.name}</span>
                      {p.restarts > 0 && (
                        <span className="flex items-center gap-0.5 text-label-sm text-on-surface-muted/40">
                          <RefreshCw className="h-2.5 w-2.5" strokeWidth={1.5} />
                          {p.restarts}
                        </span>
                      )}
                      {p.memory > 0 && (
                        <span className="font-mono text-label-sm text-on-surface-muted/30">
                          {Math.round(p.memory / 1024 / 1024)}MB
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassPanel>
        </SpatialLayer>
      )}

      {/* Activity timeline — 48h sparkline */}
      {data.timeline.length > 0 && (
        <SpatialLayer z={12} className="mt-10">
          <GlassPanel depth="elevated" className="px-6 py-5">
            <h2 className="mb-4 text-label-sm uppercase tracking-[0.1em] text-on-surface-muted/60">
              Activity — last 48 hours
            </h2>
            <ActivityTimeline data={data.timeline} />
          </GlassPanel>
        </SpatialLayer>
      )}

      {/* Cognitive streams */}
      {streams.length > 0 && (
        <SpatialLayer z={8} className="mt-8">
          <h2 className="mb-4 text-center text-label-sm uppercase tracking-[0.1em] text-on-surface-muted/50">
            Cognitive streams
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {streams.map((s) => {
              const Icon = STREAM_ICONS[s.stream] || Brain
              return (
                <GlassPanel key={s.stream} depth="surface" parallax className="px-4 py-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-on-surface-muted/40" strokeWidth={1.5} />
                    <span className="text-label-sm font-medium capitalize text-on-surface-muted/70">
                      {s.stream}
                    </span>
                  </div>
                  <p className="font-display text-2xl font-light tabular-nums text-on-surface">
                    {s.complete}<span className="text-sm text-on-surface-muted/40">/{s.total}</span>
                  </p>
                  {s.deployed > 0 && (
                    <span className="mt-1 block text-label-sm text-secondary/70">
                      {s.deployed} deployed
                    </span>
                  )}
                </GlassPanel>
              )
            })}
          </div>
        </SpatialLayer>
      )}

      {/* Two columns: session feed + sidebar */}
      <SpatialLayer z={5} className="mt-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Session feed — main column */}
          <div className="lg:col-span-2">
            <h2 className="mb-4 text-label-sm uppercase tracking-[0.1em] text-on-surface-muted/50">
              Recent sessions
            </h2>
            <SessionFeed sessions={data.sessions.slice(0, 15)} />
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            {/* Goals */}
            {goals.length > 0 && (
              <GlassPanel depth="surface" className="px-5 py-4">
                <h3 className="mb-3 text-label-sm uppercase tracking-[0.1em] text-on-surface-muted/60">
                  Active goals
                </h3>
                <div className="space-y-3">
                  {goals.slice(0, 5).map((g) => (
                    <div key={g.id}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-on-surface/80 line-clamp-1">{g.title}</span>
                        <span className="ml-2 font-mono text-label-sm text-on-surface-muted/50">
                          {Math.round(g.progress * 100)}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/20">
                        <motion.div
                          className="h-full rounded-full bg-secondary/60"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.round(g.progress * 100)}%` }}
                          transition={{ type: 'spring', stiffness: 40, damping: 15, delay: 0.2 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            )}

            {/* Git activity */}
            {gitActivity.length > 0 && (
              <GlassPanel depth="surface" className="px-5 py-4">
                <h3 className="mb-3 text-label-sm uppercase tracking-[0.1em] text-on-surface-muted/60">
                  Git activity (7d)
                </h3>
                <div className="space-y-2">
                  {gitActivity.map((g) => (
                    <div key={g.name} className="flex items-center justify-between">
                      <span className="text-sm text-on-surface/70">{g.name}</span>
                      <span className="font-mono text-label-sm text-on-surface-muted/50">
                        {g.commits} commits
                      </span>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            )}

            {/* Organism thoughts */}
            {percepts.length > 0 && (
              <GlassPanel depth="surface" className="px-5 py-4">
                <h3 className="mb-3 text-label-sm uppercase tracking-[0.1em] text-on-surface-muted/60">
                  Inner monologue
                </h3>
                <div className="space-y-3">
                  {percepts.slice(0, 5).map((p, i) => (
                    <div key={i} className="text-sm leading-relaxed text-on-surface/60">
                      {p.stream && (
                        <span className="mr-1.5 text-label-sm text-on-surface-muted/40">[{p.stream}]</span>
                      )}
                      <span>{p.message.slice(0, 140)}</span>
                      <span className="ml-1.5 text-label-sm text-on-surface-muted/30">
                        {formatRelative(p.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassPanel>
            )}
          </div>
        </div>
      </SpatialLayer>
    </div>
  )
}
