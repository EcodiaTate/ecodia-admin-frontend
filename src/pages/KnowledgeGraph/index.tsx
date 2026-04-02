import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getKGStats, getKGNode, getKGNeighborhood, triggerEmbedding } from '@/api/knowledgeGraph'
import type { KGNode } from '@/api/knowledgeGraph'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Network, Sparkles, ArrowRight, Zap } from 'lucide-react'
import toast from 'react-hot-toast'

const glide = { type: 'spring' as const, stiffness: 90, damping: 20, mass: 1 }

export default function KnowledgeGraphPage() {
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

  return (
    <div className="mx-auto max-w-5xl">
      <SpatialLayer z={25} className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
            World Model
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

      {/* Search + Actions */}
      <SpatialLayer z={10} className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center">
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
        <button
          onClick={() => embed.mutate()}
          disabled={embed.isPending}
          className="btn-primary-gradient flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium disabled:opacity-40"
        >
          <Zap className="h-3.5 w-3.5" strokeWidth={1.75} />
          {embed.isPending ? 'Embedding...' : 'Embed Nodes'}
        </button>
      </SpatialLayer>

      {/* Label Breakdown */}
      {stats && stats.labelBreakdown.length > 0 && !selectedNode && (
        <SpatialLayer z={5} className="mb-12">
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

                {/* Node properties */}
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

              {/* Neighbors */}
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
    </div>
  )
}
