import { useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useMetabolicContext } from './MetabolicProvider'

// ─── Global Constellation ────────────────────────────────────────────
// 6-10 peripheral stars near viewport edges, each mapped to a subsystem.
// Worker heartbeats = brief star flares. CC output = stronger pulses.
// Renders on non-Cortex pages only. Cortex has its own full constellation.

interface Star {
  x: number
  y: number
  baseAlpha: number
  radius: number
  breatheOffset: number
  breatheSpeed: number
  flare: number // 0 = idle, 1 = full flare, decays over time
  subsystem: string
}

const SUBSYSTEMS = ['gmail', 'linkedin', 'finance', 'crm', 'factory', 'knowledge', 'workspace', 'organism']
const BASE_OPACITY = 0.03
const FLARE_DECAY = 0.012 // per frame at ~20fps → ~3.3s full decay
const WORKER_FLARE_STRENGTH = 0.4
const FRAME_INTERVAL = 1000 / 20

/** Place stars in the peripheral band (outer 15% of viewport) */
function placeStars(w: number, h: number): Star[] {
  const margin = 0.15
  const stars: Star[] = []

  for (let i = 0; i < SUBSYSTEMS.length; i++) {
    // Distribute around the perimeter
    const angle = (i / SUBSYSTEMS.length) * Math.PI * 2 + 0.3
    const edgeBias = 0.85 + Math.random() * margin

    let x = w * 0.5 + Math.cos(angle) * w * 0.5 * edgeBias
    let y = h * 0.5 + Math.sin(angle) * h * 0.5 * edgeBias

    // Clamp inside viewport with small margin
    x = Math.max(20, Math.min(w - 20, x))
    y = Math.max(20, Math.min(h - 20, y))

    stars.push({
      x,
      y,
      baseAlpha: BASE_OPACITY + Math.random() * 0.01,
      radius: 1 + Math.random() * 0.8,
      breatheOffset: Math.random() * Math.PI * 2,
      breatheSpeed: 0.0003 + Math.random() * 0.0003,
      flare: 0,
      subsystem: SUBSYSTEMS[i],
    })
  }

  return stars
}

export function GlobalConstellation() {
  const location = useLocation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const animRef = useRef<number>(0)
  const lastFrameRef = useRef(0)
  const { constellationVisibility } = useMetabolicContext()
  const visibilityRef = useRef(0.5)

  // Track constellation visibility from pressure tiers (imperative for canvas)
  useEffect(() => {
    const unsub = constellationVisibility.on('change', (v: number) => {
      visibilityRef.current = v
    })
    return unsub
  }, [constellationVisibility])

  // Don't render on Cortex — it has its own constellation
  const isCortex = location.pathname.startsWith('/cortex')

  // Flare a subsystem's star
  const flare = useCallback((subsystem: string, strength: number) => {
    for (const star of starsRef.current) {
      if (star.subsystem === subsystem) {
        star.flare = Math.min(star.flare + strength, 1)
      }
    }
  }, [])

  // Listen for system events → flare the corresponding star
  useEffect(() => {
    if (isCortex) return

    const onActionQueue = () => flare('organism', WORKER_FLARE_STRENGTH)
    const onPressure = () => flare('organism', WORKER_FLARE_STRENGTH * 0.5)

    window.addEventListener('ecodia:action-queue-update', onActionQueue)
    window.addEventListener('ecodia:metabolic-pressure', onPressure)

    return () => {
      window.removeEventListener('ecodia:action-queue-update', onActionQueue)
      window.removeEventListener('ecodia:metabolic-pressure', onPressure)
    }
  }, [isCortex, flare])

  // Canvas animation loop
  useEffect(() => {
    if (isCortex) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1

    function resize() {
      if (!canvas) return
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
      starsRef.current = placeStars(w, h)
    }

    resize()
    window.addEventListener('resize', resize)

    function draw(time: number) {
      animRef.current = requestAnimationFrame(draw)

      const elapsed = time - lastFrameRef.current
      if (elapsed < FRAME_INTERVAL) return
      lastFrameRef.current = time - (elapsed % FRAME_INTERVAL)

      if (!ctx || !canvas) return
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)

      const visMult = visibilityRef.current

      for (const star of starsRef.current) {
        // Decay flare
        if (star.flare > 0) {
          star.flare = Math.max(0, star.flare - FLARE_DECAY)
        }

        // Breathing — modulated by pressure-tier constellation visibility
        const breathe = Math.sin(time * star.breatheSpeed + star.breatheOffset) * 0.5 + 0.5
        const alpha = (star.baseAlpha * (0.7 + breathe * 0.6) + star.flare * 0.15) * visMult
        const r = star.radius * (0.9 + breathe * 0.2) + star.flare * 1.5

        // Flare glow
        if (star.flare > 0.05) {
          const glowR = r * 8
          const grad = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowR)
          grad.addColorStop(0, `rgba(46, 204, 113, ${star.flare * 0.08})`)
          grad.addColorStop(1, 'rgba(46, 204, 113, 0)')
          ctx.beginPath()
          ctx.arc(star.x, star.y, glowR, 0, Math.PI * 2)
          ctx.fillStyle = grad
          ctx.fill()
        }

        // Core dot
        ctx.beginPath()
        ctx.arc(star.x, star.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(27, 122, 61, ${Math.min(alpha, 0.3)})`
        ctx.fill()
      }
    }

    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [isCortex])

  if (isCortex) return null

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[1] pointer-events-none"
      aria-hidden="true"
    />
  )
}
