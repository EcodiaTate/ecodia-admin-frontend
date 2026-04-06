/**
 * MemoryPanel — compact knowledge graph context panel embedded in Cortex.
 * Shows KG stats, consolidation engine status, node search, and recent nodes.
 * Absorbs the Knowledge Graph page into the Cortex workspace.
 */
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { getKGStats, getKGNode, getKGNeighborhood, getConsolidationStats } from '@/api/knowledgeGraph'
import { cn } from '@/lib/utils'
import {
  Network, Search, Brain, GitMerge, Sparkles,
  ChevronRight, ChevronDown, ExternalLink,
} from 'lucide-react'

// ── Stat ────────────────────────────────────────────────────────────────

function Stat({ icon: Icon, label, value, accent }: { icon: typeof Network; label: string; value: string; accent?: string }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <Icon className={cn('w-3 h-3', accent || 'text-on-surface-muted/30')} />
      <span className="text-[10px] text-on-surface-muted/40">{label}</span>
      <span className={cn('text-xs font-medium', accent || 'text-on-surface/70')}>{value}</span>
    </div>
  )
}

// ── Section ─────────────────────────────────────────────────────────────

function Section({ label, icon: Icon, badge, defaultOpen = true, children }: {
  label: string; icon: any; badge?: number; defaultOpen?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-1 py-1.5 text-[10px] uppercase tracking-wider text-on-surface-muted/30 hover:text-on-surface-muted/50 transition-colors">
        {open ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
        <Icon size={10} className="text-on-surface-muted/20" />
        {label}
        {badge != null && badge > 0 && (
          <span className="ml-auto rounded-full bg-primary/15 px-1.5 text-[9px] font-medium text-primary">{badge}</span>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-1 space-y-1 overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Stats Strip ─────────────────────────────────────────────────────────

function StatsStrip() {
  const { data: stats } = useQuery({
    queryKey: ['kg-stats'],
    queryFn: getKGStats,
    staleTime: 30_000,
  })

  return (
    <div className="flex items-center gap-4 px-1 py-2 overflow-x-auto scrollbar-none">
      <Stat icon={Network} label="Nodes" value={String(stats?.totalNodes ?? '—')} />
      <Stat icon={GitMerge} label="Rels" value={String(stats?.totalRelationships ?? '—')} />
      <Stat icon={Sparkles} label="Labels" value={String(stats?.labelBreakdown?.length ?? '—')} />
    </div>
  )
}

// ── Consolidation Section ───────────────────────────────────────────────

function ConsolidationSection() {
  const { data: cs } = useQuery({
    queryKey: ['kg-consolidation-stats'],
    queryFn: getConsolidationStats,
    refetchInterval: 30_000,
  })

  const statusColor = cs?.status === 'running'
    ? 'text-green-400'
    : cs?.status === 'error'
      ? 'text-red-400'
      : 'text-on-surface-muted/40'

  return (
    <div className="space-y-2">
      {/* Status line */}
      <div className="flex items-center gap-2 px-2 py-1">
        <div className={cn('w-1.5 h-1.5 rounded-full', cs?.status === 'running' ? 'bg-green-500 animate-pulse' : cs?.status === 'error' ? 'bg-red-400' : 'bg-on-surface-muted/20')} />
        <span className={cn('text-[10px] capitalize', statusColor)}>{cs?.status ?? 'unknown'}</span>
        {cs?.lastRun && (
          <span className="text-[9px] text-on-surface-muted/25 ml-auto">{timeAgo(cs.lastRun)}</span>
        )}
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-1.5 px-1">
        {[
          { label: 'Patterns', value: cs?.patternsFound ?? 0 },
          { label: 'Consolidated', value: cs?.nodesConsolidated ?? 0 },
          { label: 'Narratives', value: cs?.narrativesCreated ?? 0 },
        ].map(s => (
          <div key={s.label} className="px-2 py-1.5 rounded bg-white/[0.03] border border-white/[0.05]">
            <div className="text-xs font-light font-mono text-on-surface/70">{s.value}</div>
            <div className="text-[9px] text-on-surface-muted/30 uppercase">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Explore Section ─────────────────────────────────────────────────────

function ExploreSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [showNeighbors, setShowNeighbors] = useState(false)

  const { data: node, isFetching: nodeLoading } = useQuery({
    queryKey: ['kg-node', activeNode],
    queryFn: () => getKGNode(activeNode!),
    enabled: !!activeNode,
    staleTime: 30_000,
  })

  const { data: neighbors, isFetching: neighborsLoading } = useQuery({
    queryKey: ['kg-neighborhood', activeNode],
    queryFn: () => getKGNeighborhood(activeNode!, 1),
    enabled: !!activeNode && showNeighbors,
    staleTime: 30_000,
  })

  function handleSearch() {
    const q = searchQuery.trim()
    if (!q) return
    setActiveNode(q)
    setShowNeighbors(false)
  }

  const propertyCount = node ? Object.keys(node).filter(k => k !== 'name' && k !== 'labels').length : 0

  return (
    <div className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-on-surface-muted/30" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="Search nodes..."
          className="w-full rounded-lg border border-black/5 bg-surface-container/50 pl-7 pr-3 py-1.5 text-xs text-on-surface placeholder-on-surface-muted/30 outline-none focus:border-primary/20 transition-colors"
        />
      </div>

      {/* Loading state */}
      {nodeLoading && (
        <div className="flex items-center justify-center py-4">
          <Brain className="w-4 h-4 animate-pulse text-on-surface-muted/20" />
        </div>
      )}

      {/* Node result */}
      {node && !nodeLoading && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2 space-y-1.5"
        >
          <div className="flex items-center gap-2">
            <Network className="w-3 h-3 text-primary/50 flex-shrink-0" />
            <span className="text-xs font-medium text-on-surface/80 truncate">{node.name}</span>
          </div>

          {/* Labels */}
          {node.labels?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {node.labels.map((l: string) => (
                <span key={l} className="px-1.5 py-0.5 rounded bg-primary/10 text-[9px] text-primary/60">{l}</span>
              ))}
            </div>
          )}

          {/* Properties + Neighbors count */}
          <div className="flex items-center gap-3 text-[10px] text-on-surface-muted/40">
            <span>{propertyCount} properties</span>
            <button
              onClick={() => setShowNeighbors(!showNeighbors)}
              className="flex items-center gap-1 hover:text-primary/60 transition-colors"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              {showNeighbors ? 'hide' : 'show'} neighbors
              {showNeighbors ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
            </button>
          </div>

          {/* Neighbors list */}
          <AnimatePresence>
            {showNeighbors && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {neighborsLoading ? (
                  <div className="py-2 text-center">
                    <Brain className="w-3 h-3 animate-pulse text-on-surface-muted/20 mx-auto" />
                  </div>
                ) : neighbors && neighbors.length > 0 ? (
                  <div className="space-y-0.5 pt-1 border-t border-white/[0.04]">
                    {neighbors.slice(0, 12).map((n: any, i: number) => (
                      <button
                        key={n.name || i}
                        onClick={() => { setActiveNode(n.name); setSearchQuery(n.name); setShowNeighbors(false) }}
                        className="w-full text-left flex items-center gap-2 px-2 py-0.5 rounded hover:bg-white/[0.04] transition-colors text-[10px]"
                      >
                        <span className="text-on-surface/60 truncate flex-1">{n.name}</span>
                        {n.labels?.[0] && (
                          <span className="text-[9px] text-on-surface-muted/30">{n.labels[0]}</span>
                        )}
                      </button>
                    ))}
                    {neighbors.length > 12 && (
                      <p className="text-[9px] text-on-surface-muted/25 px-2 py-0.5">+{neighbors.length - 12} more</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[9px] text-on-surface-muted/25 py-1">No neighbors found</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Not found */}
      {activeNode && !node && !nodeLoading && (
        <p className="text-[10px] text-on-surface-muted/30 px-2 py-2">No node found for "{activeNode}"</p>
      )}
    </div>
  )
}

// ── Distribution Section ────────────────────────────────────────────────

function DistributionSection() {
  const { data: stats } = useQuery({
    queryKey: ['kg-stats'],
    queryFn: getKGStats,
    staleTime: 30_000,
  })

  const breakdown = stats?.labelBreakdown?.slice(0, 8) ?? []
  const maxCount = breakdown.length > 0 ? Math.max(...breakdown.map(b => b.count)) : 1

  if (breakdown.length === 0) {
    return <p className="text-[10px] text-on-surface-muted/25 px-2 py-2">No label data</p>
  }

  return (
    <div className="space-y-1.5">
      {breakdown.map(item => (
        <div key={item.label} className="flex items-center gap-2">
          <span className="text-[10px] text-on-surface-muted/50 w-20 truncate">{item.label}</span>
          <div className="flex-1 h-1 rounded-full bg-black/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/25"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-on-surface-muted/40 w-8 text-right">{item.count}</span>
        </div>
      ))}
    </div>
  )
}

// ── Utility ─────────────────────────────────────────────────────────────

function timeAgo(date: string) {
  const ms = Date.now() - new Date(date).getTime()
  if (ms < 60000) return 'now'
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`
  return `${Math.round(ms / 86400000)}d`
}

// ── Main Panel ──────────────────────────────────────────────────────────

export default function MemoryPanel() {
  return (
    <div className="h-full overflow-y-auto scrollbar-thin px-3 pt-3 pb-6 space-y-3">
      <StatsStrip />

      <Section label="Consolidation" icon={Brain} defaultOpen>
        <ConsolidationSection />
      </Section>

      <Section label="Explore" icon={Search} defaultOpen>
        <ExploreSection />
      </Section>

      <Section label="Distribution" icon={Sparkles} defaultOpen={false}>
        <DistributionSection />
      </Section>
    </div>
  )
}
