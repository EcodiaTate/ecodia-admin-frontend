import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getKGBriefing, getKGStats } from '@/api/knowledgeGraph'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Brain, Sparkles, Network } from 'lucide-react'
import { ConstellationCanvas } from './ConstellationCanvas'

export default function CortexPage() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: stats } = useQuery({
    queryKey: ['kgStats'],
    queryFn: getKGStats,
  })

  const briefing = useMutation({
    mutationFn: (q: string) => getKGBriefing(q),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setSubmitted(query.trim())
    briefing.mutate(query.trim())
  }

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Keyboard shortcut: Escape to clear
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('')
      setSubmitted('')
      inputRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="relative mx-auto max-w-4xl">
      {/* Ambient constellation background */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-30">
        <ConstellationCanvas nodeCount={stats?.totalNodes ?? 0} relCount={stats?.totalRelationships ?? 0} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 150, damping: 20 }}
        className="relative z-10"
      >
        {/* Header */}
        <div className="mb-20 pt-8">
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
            World Model
          </span>
          <h1 className="mt-3 font-display text-display-lg font-light text-on-surface">
            The <em className="not-italic font-normal text-primary">Cortex</em>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-on-surface-muted">
            Ask anything about your world. People, projects, decisions, context.
            The system traces through {stats?.totalNodes ?? '...'} memories and {stats?.totalRelationships ?? '...'} connections.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="glass-elevated rounded-2xl transition-all focus-within:shadow-glass-hover">
            <div className="flex items-center gap-4 px-6 py-5">
              <Search className="h-5 w-5 flex-shrink-0 text-on-surface-muted" strokeWidth={1.5} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Who is Tom Grote? What's happening with Goodreach? Who do I need to respond to?"
                className="flex-1 bg-transparent text-base text-on-surface placeholder-on-surface-muted/60 outline-none"
              />
              {query.trim() && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  type="submit"
                  disabled={briefing.isPending}
                  className="flex-shrink-0 rounded-xl bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15 disabled:opacity-40"
                >
                  {briefing.isPending ? (
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 animate-pulse" strokeWidth={1.75} />
                      Thinking...
                    </span>
                  ) : (
                    'Recall'
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </form>

        {/* Results */}
        <AnimatePresence mode="wait">
          {briefing.isPending && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-12 flex items-center gap-3"
            >
              <div className="relative h-8 w-8">
                <div className="absolute inset-0 animate-pulse-glow rounded-full bg-primary/10" />
                <div className="absolute inset-1 animate-spin rounded-full border-2 border-surface-container border-t-primary" />
              </div>
              <span className="text-sm text-on-surface-muted">
                Tracing through the world model...
              </span>
            </motion.div>
          )}

          {!briefing.isPending && briefing.data?.briefing && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 150, damping: 20 }}
              className="mt-12"
            >
              {/* Briefing card */}
              <div className="glass rounded-3xl p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                    <Brain className="h-4 w-4 text-primary" strokeWidth={1.75} />
                  </div>
                  <div>
                    <span className="text-label-sm uppercase tracking-[0.1em] text-on-surface-muted">
                      Intelligence Briefing
                    </span>
                    <p className="text-xs text-on-surface-muted/60">
                      re: {submitted}
                    </p>
                  </div>
                </div>

                <div className="text-sm leading-[1.8] text-on-surface-variant">
                  {briefing.data.briefing.split('\n\n').map((para, i) => (
                    <p key={i} className={i > 0 ? 'mt-4' : ''}>
                      {para}
                    </p>
                  ))}
                </div>
              </div>

              {/* Raw graph trace (collapsible) */}
              {briefing.data.raw && (
                <RawTracePanel raw={briefing.data.raw} />
              )}
            </motion.div>
          )}

          {!briefing.isPending && briefing.data && !briefing.data.briefing && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-12 text-center"
            >
              <p className="text-sm text-on-surface-muted">
                No memories found for "{submitted}". The cortex will learn about this as data flows through the system.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ambient stats */}
        {!submitted && stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-24 flex items-center justify-center gap-8"
          >
            <div className="flex items-center gap-2 text-on-surface-muted/40">
              <Network className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="font-mono text-label-sm">{stats.totalNodes} nodes</span>
            </div>
            <div className="h-3 w-px bg-surface-container" />
            <span className="font-mono text-label-sm text-on-surface-muted/40">
              {stats.totalRelationships} connections
            </span>
            <div className="h-3 w-px bg-surface-container" />
            <span className="font-mono text-label-sm text-on-surface-muted/40">
              {stats.labelBreakdown.length} entity types
            </span>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

function RawTracePanel({ raw }: { raw: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="text-label-sm uppercase tracking-[0.05em] text-on-surface-muted/40 transition-colors hover:text-on-surface-muted"
      >
        {open ? 'Hide' : 'Show'} graph trace
      </button>
      <AnimatePresence>
        {open && (
          <motion.pre
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden rounded-2xl bg-surface-container-low/60 p-6 font-mono text-xs leading-relaxed text-on-surface-muted"
          >
            {raw}
          </motion.pre>
        )}
      </AnimatePresence>
    </div>
  )
}
