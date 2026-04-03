import { useMemo, useRef } from 'react'
import { motion, useTransform, useMotionValueEvent } from 'framer-motion'
import { useSpatialContext } from './SpatialDepthProvider'
import { useMetabolicContext } from './MetabolicProvider'

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
  color: string
  /** Simulated depth - particles at different "distances" drift differently */
  zFactor: number
}

const COLORS = [
  'rgba(46, 204, 113, 0.6)',
  'rgba(27, 122, 61, 0.5)',
  'rgba(200, 145, 10, 0.5)',
  'rgba(245, 200, 66, 0.4)',
]

function generateParticles(count: number): Particle[] {
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
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
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      zFactor: 0.3 + Math.random() * 1.2,
    })
  }
  return particles
}

/** Individual particle that drifts with spatial tilt and metabolic pressure */
function SpatialParticle({ p }: { p: Particle }) {
  const { tiltX, tiltY } = useSpatialContext()
  const { driftScale } = useMetabolicContext()
  const animRef = useRef<HTMLDivElement>(null)

  const x = useTransform(tiltX, (v) => v * p.zFactor * 8)
  const y = useTransform(tiltY, (v) => v * p.zFactor * 8)

  // driftScale: 1.0 (calm) → 2.2 (urgent)
  // Faster drift = shorter animation duration
  const modulatedDuration = useTransform(driftScale, (s: number) => p.duration / s)

  // Imperatively update CSS animation-duration — zero re-renders
  useMotionValueEvent(modulatedDuration, 'change', (d) => {
    if (animRef.current) {
      animRef.current.style.animationDuration = `${d}s`
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
          background: p.color,
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
  const particles = useMemo(() => generateParticles(8), [])

  return (
    <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <SpatialParticle key={p.id} p={p} />
      ))}
    </div>
  )
}
