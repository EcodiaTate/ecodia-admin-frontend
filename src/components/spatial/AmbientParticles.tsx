import { useMemo, useRef } from 'react'
import { motion, useTransform, useMotionValueEvent } from 'framer-motion'
import { useSpatialContext } from './SpatialDepthProvider'
import { useMetabolicContext } from './MetabolicProvider'
import { useFocusStore } from '@/store/focusStore'
import { useWorkerStore } from '@/store/workerStore'

// ─── Semantic Particles ──────────────────────────────────────────────
// Green = healthy processes. Gold = pending items / attention needed.
// Ratio shifts dynamically based on worker health.

interface Particle {
  id: number
  left: string
  top: string
  size: number
  opacity: number
  duration: number
  delay: number
  dx: number
  dy: number
  /** Semantic: true = gold (pending/attention), false = green (healthy) */
  isGold: boolean
  /** Simulated depth - particles at different "distances" drift differently */
  zFactor: number
}

const GREEN_COLORS = ['rgba(46, 204, 113, 0.6)', 'rgba(27, 122, 61, 0.5)']
const GOLD_COLORS = ['rgba(200, 145, 10, 0.5)', 'rgba(245, 200, 66, 0.4)']

/** goldRatio: 0 = all green, 1 = all gold */
function generateParticles(count: number, goldRatio: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const isGold = Math.random() < goldRatio
    particles.push({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 2 + Math.random() * 4,
      opacity: 0.03 + Math.random() * 0.05,
      duration: 20 + Math.random() * 25,
      delay: Math.random() * -30,
      dx: 15 + Math.random() * 40,
      dy: 15 + Math.random() * 40,
      isGold,
      zFactor: 0.3 + Math.random() * 1.2,
    })
  }
  return particles
}

function particleColor(p: Particle): string {
  const palette = p.isGold ? GOLD_COLORS : GREEN_COLORS
  return palette[p.id % palette.length]
}

/** Individual particle that drifts with spatial tilt and metabolic pressure */
function SpatialParticle({ p }: { p: Particle }) {
  const { tiltX, tiltY } = useSpatialContext()
  const { driftScale, particleGravity } = useMetabolicContext()
  const focused = useFocusStore((s) => s.focused)
  const animRef = useRef<HTMLDivElement>(null)

  const x = useTransform(tiltX, (v) => v * p.zFactor * 8)
  // Vertical drift includes gravity bias: obligations/survival push particles downward
  const y = useTransform(
    [tiltY, particleGravity],
    ([t, g]: number[]) => t * p.zFactor * 8 + g * 30 * p.zFactor,
  )

  // driftScale: 0.6 (lazy growth) → 0.1 (survival=stationary)
  // Focus mode doubles duration (particles slow down)
  const focusMult = focused ? 0.5 : 1
  const modulatedDuration = useTransform(driftScale, (s: number) => p.duration / (Math.max(0.1, s) * focusMult))

  // Imperatively update CSS animation-duration — zero re-renders
  useMotionValueEvent(modulatedDuration, 'change', (d) => {
    if (animRef.current) {
      animRef.current.style.animationDuration = `${d}s`
    }
  })

  // Particle opacity responds to pressure: survival tier dims particles
  useMotionValueEvent(driftScale, 'change', (s) => {
    if (animRef.current) {
      // At survival (driftScale~0.1), particles are nearly invisible
      const pressureOpacity = Math.max(0.15, Math.min(1, s))
      animRef.current.style.opacity = String(p.opacity * pressureOpacity)
    }
  })

  return (
    <motion.div
      className="ambient-particle"
      style={{
        left: p.left,
        top: p.top,
        width: p.size,
        height: p.size,
        x,
        y,
      }}
    >
      <div
        ref={animRef}
        className="absolute inset-0 rounded-full"
        style={{
          opacity: p.opacity,
          background: particleColor(p),
          animation: `float-particle ${p.duration}s cubic-bezier(0.42, 0, 0.58, 1) infinite`,
          animationDelay: `${p.delay}s`,
          '--p-dx': `${p.dx}px`,
          '--p-dy': `${p.dy}px`,
        } as React.CSSProperties}
      />
    </motion.div>
  )
}

export function AmbientParticles() {
  const workers = useWorkerStore((s) => s.workers)

  // Compute gold ratio: proportion of workers that are stale or erroring
  const goldRatio = useMemo(() => {
    const entries = Object.values(workers)
    if (entries.length === 0) return 0.25 // default: mostly green
    const unhealthy = entries.filter((w) => w.status === 'error' || w.status === 'stale').length
    return Math.min(unhealthy / entries.length, 0.8) // cap at 80% gold
  }, [workers])

  // Quantise goldRatio to avoid regenerating on every tiny change
  const quantised = Math.round(goldRatio * 4) / 4
  const particles = useMemo(() => generateParticles(8, quantised), [quantised])

  return (
    <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <SpatialParticle key={p.id} p={p} />
      ))}
    </div>
  )
}
