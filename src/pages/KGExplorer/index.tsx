import { useState, useCallback, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  searchKGNodes, getNodeGraph, getKGStats, getKGNode,
  type KGSearchResult, type KGGraphData,
} from '@/api/knowledgeGraph'
import { getExplorerStatus } from '@/api/kgExplorer'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, X, ChevronRight, Network, Maximize2, Minimize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide,
  type SimulationNodeDatum, type SimulationLinkDatum,
} from 'd3-force'

const glide = { type: 'spring' as const, stiffness: 90, damping: 20, mass: 1 }

// Color palette for node labels
const LABEL_COLORS: Record<string, string> = {
  Person: '#60a5fa',
  Organisation: '#f472b6',
  Project: '#34d399',
  Concept: '#a78bfa',
  Event: '#fbbf24',
  Decision: '#fb923c',
  Problem: '#f87171',
  Insight: '#c084fc',
  Narrative: '#2dd4bf',
  Prediction: '#e879f9',
  Deployment: '#38bdf8',
  Document: '#94a3b8',
  Codebase: '#4ade80',
  Pattern: '#818cf8',
  SymbridgeEvent: '#67e8f9',
  Episode: '#fca5a5',
}

function getLabelColor(labels: string[]): string {
  for (const l of labels) {
    if (LABEL_COLORS[l]) return LABEL_COLORS[l]
  }
  return '#94a3b8'
}

// ── Graph Simulation Types ───────────────────────────────────────────

interface SimNode extends SimulationNodeDatum {
  id: string
  labels: string[]
  description?: string | null
  importance?: number | null
  isCenter?: boolean
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  type: string
}

// ── Force Graph Canvas ───────────────────────────────────────────────

function ForceGraph({
  data,
  onNodeClick,
  selectedNode,
  width,
  height,
}: {
  data: KGGraphData
  onNodeClick: (name: string) => void
  selectedNode: string | null
  width: number
  height: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null)
  const nodesRef = useRef<SimNode[]>([])
  const linksRef = useRef<SimLink[]>([])
  const transformRef = useRef({ x: 0, y: 0, k: 1 })
  const dragRef = useRef<{ node: SimNode | null; offsetX: number; offsetY: number }>({ node: null, offsetX: 0, offsetY: 0 })
  const panRef = useRef<{ active: boolean; startX: number; startY: number; startTx: number; startTy: number }>({ active: false, startX: 0, startY: 0, startTx: 0, startTy: 0 })
  const hoveredRef = useRef<string | null>(null)
  const animRef = useRef<number>(0)

  // Build simulation when data changes
  useEffect(() => {
    if (!data.nodes.length) return

    const nodes: SimNode[] = data.nodes.map(n => ({
      id: n.name,
      labels: n.labels,
      description: n.description,
      importance: n.importance,
      isCenter: n.isCenter,
      x: n.isCenter ? width / 2 : undefined,
      y: n.isCenter ? height / 2 : undefined,
    }))

    const nodeIds = new Set(nodes.map(n => n.id))
    const links: SimLink[] = data.edges
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map(e => ({ source: e.source, target: e.target, type: e.type }))

    nodesRef.current = nodes
    linksRef.current = links

    const sim = forceSimulation<SimNode>(nodes)
      .force('link', forceLink<SimNode, SimLink>(links).id(d => d.id).distance(120).strength(0.4))
      .force('charge', forceManyBody().strength(-300))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide(30))
      .alphaDecay(0.02)

    simRef.current = sim

    sim.on('tick', () => {}) // we draw in the animation loop

    return () => { sim.stop() }
  }, [data, width, height])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function draw() {
      if (!ctx || !canvas) return
      const { x: tx, y: ty, k } = transformRef.current
      const dpr = window.devicePixelRatio || 1

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.translate(tx, ty)
      ctx.scale(k, k)

      const nodes = nodesRef.current
      const links = linksRef.current

      // Draw edges
      for (const link of links) {
        const s = link.source as SimNode
        const t = link.target as SimNode
        if (s.x == null || s.y == null || t.x == null || t.y == null) continue

        const isHighlighted = selectedNode && (s.id === selectedNode || t.id === selectedNode)
        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(t.x, t.y)
        ctx.strokeStyle = isHighlighted ? 'rgba(167, 139, 250, 0.6)' : 'rgba(148, 163, 184, 0.15)'
        ctx.lineWidth = isHighlighted ? 1.5 : 0.8
        ctx.stroke()

        // Edge label
        if (k > 0.6) {
          const mx = (s.x + t.x) / 2
          const my = (s.y + t.y) / 2
          ctx.font = `${9 / k}px monospace`
          ctx.fillStyle = isHighlighted ? 'rgba(167, 139, 250, 0.7)' : 'rgba(148, 163, 184, 0.3)'
          ctx.textAlign = 'center'
          ctx.fillText(link.type, mx, my - 3 / k)
        }
      }

      // Draw nodes
      for (const node of nodes) {
        if (node.x == null || node.y == null) continue
        const color = getLabelColor(node.labels)
        const isSelected = node.id === selectedNode
        const isHovered = node.id === hoveredRef.current
        const radius = node.isCenter ? 14 : (node.importance ? 8 + node.importance * 6 : 8)

        // Glow
        if (isSelected || isHovered) {
          ctx.beginPath()
          ctx.arc(node.x, node.y, radius + 6, 0, Math.PI * 2)
          ctx.fillStyle = adjustAlpha(color, 0.15)
          ctx.fill()
        }

        // Node circle
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
        ctx.fillStyle = isSelected || isHovered ? color : adjustAlpha(color, 0.7)
        ctx.fill()
        ctx.strokeStyle = isSelected ? '#fff' : adjustAlpha(color, 0.3)
        ctx.lineWidth = isSelected ? 2 : 1
        ctx.stroke()

        // Label
        if (k > 0.4) {
          ctx.font = `${Math.max(10, 11 / k)}px -apple-system, BlinkMacSystemFont, sans-serif`
          ctx.fillStyle = isSelected || isHovered ? '#e0e0e8' : 'rgba(200, 200, 208, 0.7)'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'top'
          const label = node.id.length > 30 ? node.id.slice(0, 28) + '...' : node.id
          ctx.fillText(label, node.x, node.y + radius + 4)
        }
      }

      ctx.restore()
      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [data, selectedNode])

  // Resize canvas for DPR
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
  }, [width, height])

  // Hit test helper
  const hitTest = useCallback((clientX: number, clientY: number): SimNode | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const { x: tx, y: ty, k } = transformRef.current
    const mx = (clientX - rect.left - tx) / k
    const my = (clientY - rect.top - ty) / k

    for (const node of nodesRef.current) {
      if (node.x == null || node.y == null) continue
      const radius = node.isCenter ? 14 : 8
      const dx = mx - node.x
      const dy = my - node.y
      if (dx * dx + dy * dy < (radius + 5) * (radius + 5)) return node
    }
    return null
  }, [])

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const hit = hitTest(e.clientX, e.clientY)
    if (hit) {
      dragRef.current = {
        node: hit,
        offsetX: (e.clientX - transformRef.current.x) / transformRef.current.k - (hit.x || 0),
        offsetY: (e.clientY - transformRef.current.y) / transformRef.current.k - (hit.y || 0),
      }
      hit.fx = hit.x
      hit.fy = hit.y
      simRef.current?.alphaTarget(0.1).restart()
    } else {
      panRef.current = { active: true, startX: e.clientX, startY: e.clientY, startTx: transformRef.current.x, startTy: transformRef.current.y }
    }
  }, [hitTest])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { x: tx, y: ty, k } = transformRef.current
    if (dragRef.current.node) {
      const node = dragRef.current.node
      node.fx = (e.clientX - tx) / k - dragRef.current.offsetX
      node.fy = (e.clientY - ty) / k - dragRef.current.offsetY
      return
    }
    if (panRef.current.active) {
      transformRef.current.x = panRef.current.startTx + (e.clientX - panRef.current.startX)
      transformRef.current.y = panRef.current.startTy + (e.clientY - panRef.current.startY)
      return
    }
    const hit = hitTest(e.clientX, e.clientY)
    const canvas = canvasRef.current
    if (canvas) canvas.style.cursor = hit ? 'pointer' : 'grab'
    hoveredRef.current = hit?.id || null
  }, [hitTest])

  const handleMouseUp = useCallback(() => {
    if (dragRef.current.node) {
      const node = dragRef.current.node
      node.fx = null
      node.fy = null
      simRef.current?.alphaTarget(0)
      dragRef.current = { node: null, offsetX: 0, offsetY: 0 }
    }
    panRef.current.active = false
  }, [])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (panRef.current.active) return
    const hit = hitTest(e.clientX, e.clientY)
    if (hit) onNodeClick(hit.id)
  }, [hitTest, onNodeClick])

  // Attach wheel handler natively for passive: false (preventDefault needs non-passive)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const t = transformRef.current
      const newK = Math.max(0.1, Math.min(5, t.k * delta))
      t.x = mx - (mx - t.x) * (newK / t.k)
      t.y = my - (my - t.y) * (newK / t.k)
      t.k = newK
    }
    canvas.addEventListener('wheel', handler, { passive: false })
    return () => canvas.removeEventListener('wheel', handler)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleClick}
      style={{ cursor: 'grab' }}
      className="rounded-2xl"
    />
  )
}

function adjustAlpha(hex: string, alpha: number): string {
  // Convert hex to rgba
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// ── Detail Panel ─────────────────────────────────────────────────────

function DetailPanel({
  nodeName,
  graphData,
  onNavigate,
  onClose,
}: {
  nodeName: string
  graphData: KGGraphData | null
  onNavigate: (name: string) => void
  onClose: () => void
}) {
  const { data: nodeDetail, isLoading } = useQuery({
    queryKey: ['kgNode', nodeName],
    queryFn: () => getKGNode(nodeName),
    enabled: !!nodeName,
  })

  const node = nodeDetail || graphData?.nodes.find(n => n.name === nodeName)
  const edges = graphData?.edges.filter(e => e.source === nodeName || e.target === nodeName) || []

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={glide}
      className="absolute top-0 right-0 h-full w-80 z-10"
    >
      <GlassPanel depth="elevated" className="h-full overflow-y-auto p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(node?.labels || []).map(l => (
                <span
                  key={l}
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ backgroundColor: adjustAlpha(LABEL_COLORS[l] || '#94a3b8', 0.2), color: LABEL_COLORS[l] || '#94a3b8' }}
                >
                  {l}
                </span>
              ))}
            </div>
            <h3 className="text-sm font-medium text-on-surface break-words">{nodeName}</h3>
          </div>
          <button onClick={onClose} className="ml-2 shrink-0 rounded-lg p-1 text-on-surface-muted/40 hover:text-on-surface-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading && <p className="text-xs text-on-surface-muted/40">Loading...</p>}

        {node?.description != null && (
          <p className="text-xs text-on-surface-muted/60 mb-4 leading-relaxed">{String(node.description)}</p>
        )}

        {node?.importance != null && (
          <div className="mb-4">
            <span className="text-[10px] uppercase tracking-wider text-on-surface-muted/40">Importance</span>
            <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-primary/60"
                style={{ width: `${(node.importance as number) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Properties */}
        {nodeDetail && (
          <div className="mb-4">
            <span className="text-[10px] uppercase tracking-wider text-on-surface-muted/40">Properties</span>
            <div className="mt-2 space-y-1">
              {Object.entries(nodeDetail)
                .filter(([k]) => !['name', 'labels', 'description', 'importance', 'embedding', 'embedding_text', 'embedding_stale'].includes(k))
                .filter(([, v]) => v != null && v !== '')
                .slice(0, 15)
                .map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-[11px]">
                    <span className="shrink-0 text-on-surface-muted/40">{k}:</span>
                    <span className="text-on-surface-variant truncate">{String(v)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Connected edges */}
        {edges.length > 0 && (
          <div>
            <span className="text-[10px] uppercase tracking-wider text-on-surface-muted/40">
              Connections ({edges.length})
            </span>
            <div className="mt-2 space-y-1">
              {edges.map((e, i) => {
                const isOutgoing = e.source === nodeName
                const other = isOutgoing ? e.target : e.source
                return (
                  <button
                    key={i}
                    onClick={() => onNavigate(other)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] hover:bg-white/20 group"
                  >
                    <ChevronRight className={cn(
                      'h-3 w-3 shrink-0 text-on-surface-muted/30',
                      !isOutgoing && 'rotate-180',
                    )} />
                    <span className="text-violet-300/60 font-mono shrink-0">{e.type}</span>
                    <span className="text-on-surface-variant truncate group-hover:text-on-surface">{other}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </GlassPanel>
    </motion.div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────

export default function KGExplorerPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<KGSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [graphData, setGraphData] = useState<KGGraphData | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [graphDepth, setGraphDepth] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const graphContainerRef = useRef<HTMLDivElement>(null)
  const [graphSize, setGraphSize] = useState({ w: 800, h: 500 })
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>()

  const { data: status } = useQuery({
    queryKey: ['kgExplorerStatus'],
    queryFn: getExplorerStatus,
    refetchInterval: 30000,
  })

  const { data: stats } = useQuery({
    queryKey: ['kgStats'],
    queryFn: getKGStats,
  })

  // Debounced search
  const handleSearchInput = useCallback((val: string) => {
    setSearchQuery(val)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    if (val.trim().length < 2) { setSearchResults([]); return }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchKGNodes(val.trim(), 15)
        setSearchResults(results)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [])

  // Load graph for a node
  const loadGraph = useCallback(async (name: string, depth = graphDepth) => {
    setLoading(true)
    try {
      const data = await getNodeGraph(name, depth)
      setGraphData(data)
      setSelectedNode(name)
      setSearchResults([])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load graph')
    } finally {
      setLoading(false)
    }
  }, [graphDepth])

  // Resize observer for graph canvas
  useEffect(() => {
    const el = graphContainerRef.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setGraphSize({ w: entry.contentRect.width, h: entry.contentRect.height })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Keyboard shortcut: Escape to deselect
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNode(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleNodeClick = useCallback((name: string) => {
    if (name === selectedNode) {
      // Double-click to navigate into node
      loadGraph(name)
    } else {
      setSelectedNode(name)
    }
  }, [selectedNode, loadGraph])

  const handleNavigate = useCallback((name: string) => {
    loadGraph(name)
  }, [loadGraph])

  return (
    <div className={cn(
      'mx-auto',
      fullscreen ? 'fixed inset-0 z-50 bg-surface p-4' : 'max-w-7xl',
    )}>
      {/* Header */}
      <SpatialLayer z={25} className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted/60">
            Visual Explorer
          </span>
          <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
            Knowledge <em className="not-italic font-normal text-gold">Graph</em>
          </h1>
        </div>

        <div className="flex items-center gap-4 sm:pt-4">
          {stats && (
            <span className="text-label-sm text-on-surface-muted/40">
              {stats.totalNodes.toLocaleString()} nodes / {stats.totalRelationships.toLocaleString()} edges
            </span>
          )}
          <div className={cn(
            'h-2.5 w-2.5 rounded-full',
            status?.connected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.4)]',
          )} />
        </div>
      </SpatialLayer>

      {/* Search bar */}
      <SpatialLayer z={15} className="mb-6">
        <GlassPanel depth="surface" className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-muted/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearchInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  loadGraph(searchResults[0].name)
                }
              }}
              placeholder="Search nodes by name..."
              className="w-full rounded-xl bg-surface/40 py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-muted/40 outline-none focus:bg-surface/60"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-muted/40 hover:text-on-surface-muted"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Search results dropdown */}
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="mt-2 max-h-64 overflow-y-auto rounded-xl bg-surface/60 p-1"
              >
                {searchResults.map(r => (
                  <button
                    key={r.name}
                    onClick={() => loadGraph(r.name)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/20 group"
                  >
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: getLabelColor(r.labels) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-on-surface-variant truncate group-hover:text-on-surface">
                        {r.name}
                      </p>
                      <p className="text-[10px] text-on-surface-muted/40 truncate">
                        {r.labels.join(', ')}
                        {r.description ? ` — ${r.description}` : ''}
                      </p>
                    </div>
                    {r.importance != null && (
                      <span className="text-[10px] text-on-surface-muted/30 shrink-0">
                        {(r.importance * 100).toFixed(0)}%
                      </span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {searching && (
            <p className="mt-2 text-xs text-on-surface-muted/40 px-2">Searching...</p>
          )}
        </GlassPanel>
      </SpatialLayer>

      {/* Graph area */}
      <SpatialLayer z={0} className="mb-6">
        <div className="relative">
          <GlassPanel depth="elevated" className="overflow-hidden">
            <div
              ref={graphContainerRef}
              className={cn(
                'relative',
                fullscreen ? 'h-[calc(100vh-12rem)]' : 'h-[500px] sm:h-[600px]',
              )}
            >
              {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/40">
                  <div className="flex items-center gap-3 text-sm text-on-surface-muted/60">
                    <Network className="h-4 w-4 animate-spin" />
                    Loading graph...
                  </div>
                </div>
              )}

              {!graphData && !loading && (
                <div className="flex h-full flex-col items-center justify-center gap-4">
                  <Network className="h-10 w-10 text-on-surface-muted/15" strokeWidth={1} />
                  <p className="text-sm text-on-surface-muted/40">Search for a node to explore its neighborhood</p>
                  {stats && stats.labelBreakdown.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 max-w-md">
                      {stats.labelBreakdown.slice(0, 8).map(lb => (
                        <button
                          key={lb.label}
                          onClick={() => handleSearchInput(lb.label.toLowerCase())}
                          className="flex items-center gap-1.5 rounded-full bg-white/30 px-2.5 py-1 text-[11px] text-on-surface-muted/50 hover:bg-white/45 hover:text-on-surface-variant"
                        >
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: LABEL_COLORS[lb.label] || '#94a3b8' }}
                          />
                          {lb.label} ({lb.count})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {graphData && graphSize.w > 0 && (
                <ForceGraph
                  data={graphData}
                  onNodeClick={handleNodeClick}
                  selectedNode={selectedNode}
                  width={graphSize.w}
                  height={graphSize.h}
                />
              )}

              {/* Detail panel overlay */}
              <AnimatePresence>
                {selectedNode && graphData && (
                  <DetailPanel
                    nodeName={selectedNode}
                    graphData={graphData}
                    onNavigate={handleNavigate}
                    onClose={() => setSelectedNode(null)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Graph controls */}
            {graphData && (
              <div className="flex items-center justify-between border-t border-on-surface-muted/5 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-on-surface-muted/40">Depth</span>
                  {[1, 2, 3].map(d => (
                    <button
                      key={d}
                      onClick={() => {
                        setGraphDepth(d)
                        const center = graphData.nodes.find(n => n.isCenter)
                        if (center) loadGraph(center.name, d)
                      }}
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs',
                        d === graphDepth
                          ? 'bg-primary/15 text-primary'
                          : 'text-on-surface-muted/40 hover:text-on-surface-muted',
                      )}
                    >
                      {d}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-on-surface-muted/30 mr-2">
                    {graphData.nodes.length} nodes / {graphData.edges.length} edges
                  </span>
                  <button
                    onClick={() => setFullscreen(f => !f)}
                    className="rounded-lg p-1.5 text-on-surface-muted/40 hover:text-on-surface-muted"
                    title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  >
                    {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </GlassPanel>
        </div>
      </SpatialLayer>

      {/* Legend */}
      {graphData && (
        <SpatialLayer z={-5}>
          <div className="flex flex-wrap gap-3 px-1">
            {Array.from(new Set(graphData.nodes.flatMap(n => n.labels))).map(label => (
              <div key={label} className="flex items-center gap-1.5 text-[10px] text-on-surface-muted/40">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: LABEL_COLORS[label] || '#94a3b8' }}
                />
                {label}
              </div>
            ))}
          </div>
        </SpatialLayer>
      )}
    </div>
  )
}
