import { useMemo } from 'react'

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
}

const COLORS = [
  'rgba(6, 182, 212, 0.7)',
  'rgba(0, 104, 122, 0.6)',
  'rgba(16, 185, 129, 0.5)',
  'rgba(245, 158, 11, 0.4)',
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
    })
  }
  return particles
}

export function AmbientParticles() {
  const particles = useMemo(() => generateParticles(8), [])

  return (
    <div className="fixed inset-0 z-[5] pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="ambient-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            '--p-opacity': p.opacity,
            '--p-duration': `${p.duration}s`,
            '--p-delay': `${p.delay}s`,
            '--p-dx': `${p.dx}px`,
            '--p-dy': `${p.dy}px`,
            '--p-color': p.color,
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
