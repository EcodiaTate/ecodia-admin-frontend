import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getKGStats, getKGNode, getKGNeighborhood, triggerEmbedding } from '@/api/knowledgeGraph'
import { getClients } from '@/api/crm'
import type { KGNode } from '@/api/knowledgeGraph'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Network, Sparkles, ArrowRight, Zap, BookOpen, Users } from 'lucide-react'
import { cn, formatRelative } from '@/lib/utils'
import toast from 'react-hot-toast'

type Tab = 'explore' | 'archive'

const glide = { type: 'spring' as const, stiffness: 90, damping: 20, mass: 1 }

export default function KnowledgeGraphPage() {
  const [tab, setTab] = useState<Tab>('explore')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNode, setSelectedNode] = useState<KGNode | null>(null)
  const [neighbors, setNeighbors] = useState<KGNode[]>([])

  const { data: stats } = useQuery({
    queryKey: ['kgStats'],
    queryFn: getKGStats,
  })

  const embed = useMutation({
    mutationFn: triggerEmbedding,
    onSuccess: (data) => toast.success(`Embedded ${data.embedded} nodes`),
    onError: () => toast.error('Embedding failed'),
  })

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    try {
      const node = await getKGNode(searchQuery.trim())
      setSelectedNode(node)
      const hood = await getKGNeighborhood(searchQuery.trim(), 1)
      setNeighbors(hood)
    } catch {
      toast.error('Node not found')
      setSelectedNode(null)
      setNeighbors([])
    }
  }

  const exploreNode = async (name: string) => {
    setTab('explore')
    setSearchQuery(name)
    try {
      const node = await getKGNode(name)
      setSelectedNode(node)
      const hood = await getKGNeighborhood(name, 1)
      setNeighbors(hood)
    } catch {
      toast.error('Node not found')
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof Network }[] = [
    { key: 'explore', label: 'Explore', icon: Network },
    { key: 'archive', label: 'Archive', icon: BookOpen },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <SpatialLayer z={25} className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
            Institutional Memory
          </span>
          <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
            Knowledge <em className="not-italic font-normal text-primary">Graph</em>
          </h1>
        </div>

        <div className="flex flex-wrap gap-4 sm:gap-6 sm:pt-2">
          {stats && (
            <>
              <WhisperStat label="Active Nodes" value={stats.totalNodes.toLocaleString()} accent="text-primary" />
              <WhisperStat label="Connections" value={stats.totalRelationships.toLocaleString()} accent="text-secondary" />
              <WhisperStat label="Embedded" value={stats.embeddedNodes.toLocaleString()} accent="text-tertiary" />
            </>
          )}
        </div>
      </SpatialLayer>

      {/* Tabs */}
      <SpatialLayer z={10} className="mb-8 flex items-center justify-between">
        <div className="flex gap-1 rounded-2xl bg-surface-container-low/50 p-1">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium',
                tab === key ? 'text-primary' : 'text-on-surface-muted hover:text-on-surface-variant',
              )}
            >
              {tab === key && (
                <motion.div
                  layoutId="kg-tab-bg"
                  className="absolute inset-0 rounded-xl bg-white/60"
                  style={{ boxShadow: '0 4px 20px -4px rgba(0, 104, 122, 0.06)' }}
                  transition={glide}
                />
              )}
              <Icon className="relative h-4 w-4" strokeWidth={1.75} />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>

        {tab === 'explore' && (
          <button
            onClick={() => embed.mutate()}
            disabled={embed.isPending}
            className="btn-primary-gradient flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium disabled:opacity-40"
          >
            <Zap className="h-3.5 w-3.5" strokeWidth={1.75} />
            {embed.isPending ? 'Embedding...' : 'Embed Nodes'}
          </button>
        )}
      </SpatialLayer>

      <AnimatePresence mode="wait">
        {tab === 'explore' ? (
          <motion.div key="explore" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={glide}>
            <ExploreTab
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedNode={selectedNode}
              neighbors={neighbors}
              stats={stats}
              handleSearch={handleSearch}
              exploreNode={exploreNode}
            />
          </motion.div>
        ) : (
          <motion.div key="archive" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={glide}>
            <ArchiveTab stats={stats} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Explore Tab ──────────────────────────────────────────────────────

interface ExploreTabProps {
  searchQuery: string
  setSearchQuery: (q: string) => void
  selectedNode: KGNode | null
  neighbors: KGNode[]
  stats: Awaited<ReturnType<typeof getKGStats>> | undefined
  handleSearch: () => void
  exploreNode: (name: string) => void
}

function ExploreTab({ searchQuery, setSearchQuery, selectedNode, neighbors, stats, handleSearch, exploreNode }: ExploreTabProps) {
  return (
    <>
      {/* Search */}
      <SpatialLayer z={5} className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for a node by name..."
            className="h-11 w-full rounded-xl bg-surface-container-low/60 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-muted/50 outline-none focus:bg-white/60"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!searchQuery.trim()}
          className="h-11 rounded-xl bg-primary/10 px-5 text-sm font-medium text-primary hover:bg-primary/15 disabled:opacity-40"
        >
          Explore
        </button>
      </SpatialLayer>

      {/* Label Breakdown */}
      {stats && stats.labelBreakdown.length > 0 && !selectedNode && (
        <SpatialLayer z={0} className="mb-12">
          <h3 className="mb-4 text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">
            Node Types
          </h3>
          <div className="flex flex-wrap gap-2">
            {stats.labelBreakdown.map((lb) => (
              <button
                key={lb.label}
                onClick={() => exploreNode(lb.label)}
                className="rounded-full bg-white/40 px-4 py-2 text-sm text-on-surface-variant hover:bg-white/55"
              >
                <span className="font-medium">{lb.label}</span>
                <span className="ml-2 font-mono text-label-sm text-on-surface-muted">{lb.count}</span>
              </button>
            ))}
          </div>
        </SpatialLayer>
      )}

      {/* Selected Node Detail */}
      <AnimatePresence mode="wait">
        {selectedNode && (
          <SpatialLayer z={-5}>
            <motion.div
              key={selectedNode.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={glide}
            >
              <GlassPanel depth="elevated" className="mb-8 p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2.5 mb-2">
                      <Network className="h-4 w-4 text-primary" strokeWidth={1.75} />
                      <span className="text-label-md uppercase tracking-[0.1em] text-primary">
                        {selectedNode.labels.join(' · ')}
                      </span>
                    </div>
                    <h2 className="font-display text-headline-md font-light text-on-surface">
                      {selectedNode.name}
                    </h2>
                  </div>
                  <Sparkles className="h-5 w-5 text-primary/20" strokeWidth={1.5} />
                </div>

                <div className="mt-6 space-y-2">
                  {Object.entries(selectedNode)
                    .filter(([k]) => !['name', 'labels'].includes(k))
                    .map(([key, value]) => (
                      <div key={key} className="flex items-baseline gap-3">
                        <span className="text-label-sm uppercase tracking-wide text-on-surface-muted/50 min-w-[100px]">
                          {key}
                        </span>
                        <span className="font-mono text-sm text-on-surface-variant">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                </div>
              </GlassPanel>

              {neighbors.length > 0 && (
                <div>
                  <h3 className="mb-4 text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">
                    Connected Nodes ({neighbors.length})
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {neighbors.map((node, i) => (
                      <motion.button
                        key={node.name}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.04 }}
                        onClick={() => exploreNode(node.name)}
                        className="group flex items-center gap-3 rounded-2xl bg-white/40 px-5 py-4 text-left hover:bg-white/55"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-on-surface truncate">{node.name}</p>
                          <p className="text-label-sm text-on-surface-muted">{node.labels.join(', ')}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-on-surface-muted/30 group-hover:text-primary" strokeWidth={1.75} />
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </SpatialLayer>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Archive Tab ──────────────────────────────────────────────────────

function ArchiveTab({ stats }: { stats: Awaited<ReturnType<typeof getKGStats>> | undefined }) {
  const { data: clientData, isLoading } = useQuery({
    queryKey: ['archivedClients'],
    queryFn: () => getClients({ limit: 50 }),
  })

  const clients = clientData?.clients ?? []
  const archivedClients = clients.filter(c => c.stage === 'archived')

  return (
    <>
      {/* Knowledge Distribution */}
      {stats && stats.labelBreakdown.length > 0 && (
        <SpatialLayer z={5} className="mb-14">
          <h3 className="mb-6 text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">
            Knowledge Distribution
          </h3>
          <div className="flex flex-wrap gap-3">
            {stats.labelBreakdown.map((lb, i) => (
              <motion.div
                key={lb.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.04 }}
                className="rounded-2xl bg-white/40 px-5 py-3 hover:bg-white/55"
              >
                <p className="text-sm font-medium text-on-surface">{lb.label}</p>
                <p className="font-mono text-label-sm text-on-surface-muted">{lb.count} nodes</p>
              </motion.div>
            ))}
          </div>
        </SpatialLayer>
      )}

      {/* Archived Clients */}
      <SpatialLayer z={-5}>
        <h3 className="mb-6 flex items-center gap-2 text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">
          <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
          Archived Relationships
        </h3>

        {isLoading ? (
          <LoadingSpinner />
        ) : archivedClients.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {archivedClients.map((client, i) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.05 }}
              >
                <GlassPanel depth="surface" className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display text-sm font-medium text-on-surface">{client.name}</p>
                      {client.company && <p className="mt-0.5 text-xs text-on-surface-muted">{client.company}</p>}
                    </div>
                    <BookOpen className="h-4 w-4 text-on-surface-muted/30" strokeWidth={1.5} />
                  </div>
                  {client.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {client.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-muted">{tag}</span>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 font-mono text-label-sm text-on-surface-muted/40">
                    Archived {formatRelative(client.updated_at)}
                  </p>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <BookOpen className="mx-auto h-6 w-6 text-on-surface-muted/20" strokeWidth={1.5} />
            <p className="mt-4 text-sm text-on-surface-muted/40">
              The archive grows with each completed engagement.
            </p>
          </div>
        )}
      </SpatialLayer>
    </>
  )
}
