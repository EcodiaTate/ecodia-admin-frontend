import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { Brain, Sparkles, X } from 'lucide-react'

// ─── Organism Surfacings ─────────────────────────────────────────────
// Displays cognitive broadcasts and self-modification proposals from
// the organism as transient ambient notifications near the bottom-left.
// Fades after 60s. Max 3 visible. Teal left accent per further.md.

interface Surfacing {
  id: string
  kind: 'cognitive' | 'self_modification'
  title: string
  detail: string
  timestamp: number
}

const MAX_VISIBLE = 3
const FADE_AFTER_MS = 60_000

const spring = { type: 'spring' as const, stiffness: 80, damping: 20, mass: 1 }

export function OrganismSurfacings() {
  const location = useLocation()
  const [surfacings, setSurfacings] = useState<Surfacing[]>([])

  // Don't show on Cortex — it has its own surfacing system in the river
  const isCortex = location.pathname.startsWith('/cortex')

  const addSurfacing = useCallback((s: Omit<Surfacing, 'id' | 'timestamp'>) => {
    const id = crypto.randomUUID()
    const entry: Surfacing = { ...s, id, timestamp: Date.now() }
    setSurfacings((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), entry])

    // Auto-remove after fade duration
    setTimeout(() => {
      setSurfacings((prev) => prev.filter((x) => x.id !== id))
    }, FADE_AFTER_MS)
  }, [])

  const dismiss = useCallback((id: string) => {
    setSurfacings((prev) => prev.filter((x) => x.id !== id))
  }, [])

  useEffect(() => {
    if (isCortex) return

    const onCognitive = (e: Event) => {
      const payload = (e as CustomEvent).detail
      if (!payload) return
      addSurfacing({
        kind: 'cognitive',
        title: payload.percept_type ?? 'Cognitive Broadcast',
        detail: typeof payload.content === 'string'
          ? payload.content
          : JSON.stringify(payload.content),
      })
    }

    const onSelfMod = (e: Event) => {
      const payload = (e as CustomEvent).detail
      if (!payload) return
      addSurfacing({
        kind: 'self_modification',
        title: 'Self-Modification Proposal',
        detail: payload.description ?? payload.target ?? JSON.stringify(payload),
      })
    }

    window.addEventListener('ecodia:organism-surfacing', onCognitive)
    window.addEventListener('ecodia:self-modification', onSelfMod)

    return () => {
      window.removeEventListener('ecodia:organism-surfacing', onCognitive)
      window.removeEventListener('ecodia:self-modification', onSelfMod)
    }
  }, [isCortex, addSurfacing])

  if (isCortex || surfacings.length === 0) return null

  return (
    <div className="fixed bottom-16 left-6 z-40 flex flex-col gap-2 max-w-sm pointer-events-auto">
      <AnimatePresence>
        {surfacings.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={spring}
            className="glass rounded-2xl border-l-2 border-l-primary-container p-4 pr-3"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {s.kind === 'cognitive' ? (
                  <Brain className="h-3.5 w-3.5 text-primary-container" strokeWidth={1.75} />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-tertiary" strokeWidth={1.75} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">
                  {s.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-on-surface-variant line-clamp-3">
                  {s.detail}
                </p>
              </div>
              <button
                onClick={() => dismiss(s.id)}
                className="shrink-0 text-on-surface-muted/30 transition-colors hover:text-on-surface-muted"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
