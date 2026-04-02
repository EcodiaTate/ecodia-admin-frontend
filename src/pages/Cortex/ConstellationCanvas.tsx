import { useRef, useEffect } from 'react'

interface Props {
  nodeCount: number
  relCount: number
  activeNodes?: string[]
}

interface Star {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  brightness: number
  breatheOffset: number
  breatheSpeed: number
  active: boolean
  activePulse: number
}

export function ConstellationCanvas({ nodeCount, relCount, activeNodes = [] }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const animRef = useRef<number>(0)
  const activeCountRef = useRef(0)
  const lastFrameRef = useRef(0)

  // Track active node changes to trigger shimmer
  useEffect(() => {
    const stars = starsRef.current
    if (stars.length === 0) return

    const newActiveCount = activeNodes.length
    const hasNewNodes = newActiveCount > activeCountRef.current
    activeCountRef.current = newActiveCount

    const activateCount = Math.min(Math.max(newActiveCount * 2, 3), Math.floor(stars.length * 0.3))

    for (const star of stars) {
      star.active = false
    }

    if (newActiveCount > 0) {
      const seed = activeNodes.join('').length
      for (let i = 0; i < activateCount; i++) {
        const idx = (seed * 7 + i * 13) % stars.length
        stars[idx].active = true
        if (hasNewNodes) {
          stars[idx].activePulse = 0
        }
      }
    }
  }, [activeNodes])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx!.scale(dpr, dpr)
    }

    resize()
    window.addEventListener('resize', resize)

    // Fewer stars — cap at 70 for performance
    const starCount = Math.min(Math.max(nodeCount, 20), 70)
    const stars: Star[] = []
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        radius: Math.random() * 1.5 + 0.5,
        brightness: Math.random() * 0.4 + 0.1,
        breatheOffset: Math.random() * Math.PI * 2,
        breatheSpeed: Math.random() * 0.0008 + 0.0004,
        active: false,
        activePulse: 1,
      })
    }
    starsRef.current = stars

    const connectionDist = Math.min(100 + relCount * 0.2, 160)
    const connectionDistSq = connectionDist * connectionDist

    // Throttle to ~24fps for smooth-enough animation at half the GPU cost
    const FRAME_INTERVAL = 1000 / 24

    function draw(time: number) {
      animRef.current = requestAnimationFrame(draw)

      // Throttle
      const elapsed = time - lastFrameRef.current
      if (elapsed < FRAME_INTERVAL) return
      lastFrameRef.current = time - (elapsed % FRAME_INTERVAL)

      if (!ctx || !canvas) return
      const w = window.innerWidth
      const h = window.innerHeight

      ctx.clearRect(0, 0, w, h)

      // Update positions and active pulse
      for (const star of stars) {
        star.x += star.vx
        star.y += star.vy

        if (star.x < 0) star.x = w
        if (star.x > w) star.x = 0
        if (star.y < 0) star.y = h
        if (star.y > h) star.y = 0

        if (star.active && star.activePulse < 1) {
          star.activePulse = Math.min(star.activePulse + 0.015, 1)
        } else if (!star.active && star.activePulse > 0) {
          star.activePulse = Math.max(star.activePulse - 0.008, 0)
        }
      }

      // Draw connections — use squared distance to avoid sqrt
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x
          const dy = stars[i].y - stars[j].y
          const distSq = dx * dx + dy * dy

          if (distSq < connectionDistSq) {
            const dist = Math.sqrt(distSq)
            const bothActive = stars[i].activePulse > 0.1 && stars[j].activePulse > 0.1
            const baseOpacity = (1 - dist / connectionDist) * 0.06

            ctx.beginPath()
            ctx.moveTo(stars[i].x, stars[i].y)
            ctx.lineTo(stars[j].x, stars[j].y)

            if (bothActive) {
              const pulse = Math.min(stars[i].activePulse, stars[j].activePulse)
              ctx.strokeStyle = `rgba(46, 204, 113, ${baseOpacity + pulse * 0.12})`
              ctx.lineWidth = 0.5 + pulse * 0.5
            } else {
              ctx.strokeStyle = `rgba(27, 122, 61, ${baseOpacity})`
              ctx.lineWidth = 0.5
            }
            ctx.stroke()
          }
        }
      }

      // Draw stars — skip expensive gradient for inactive stars
      for (const star of stars) {
        const breathe = Math.sin(time * star.breatheSpeed + star.breatheOffset) * 0.5 + 0.5
        const isActive = star.activePulse > 0.01
        const activeMult = 1 + star.activePulse * 1.2
        const alpha = star.brightness * (0.6 + breathe * 0.4) * activeMult
        const r = star.radius * (0.8 + breathe * 0.4) * (1 + star.activePulse * 0.6)

        if (isActive) {
          // Shimmer glow for active nodes
          const shimmer = Math.sin(time * 0.003 + star.breatheOffset) * 0.5 + 0.5
          const glowRadius = r * 6 + shimmer * r * 3
          const glowGradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, glowRadius)
          glowGradient.addColorStop(0, `rgba(46, 204, 113, ${star.activePulse * 0.12})`)
          glowGradient.addColorStop(1, 'rgba(46, 204, 113, 0)')
          ctx.beginPath()
          ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2)
          ctx.fillStyle = glowGradient
          ctx.fill()
        }

        // Core dot — simple fill, no gradient for inactive stars
        ctx.beginPath()
        ctx.arc(star.x, star.y, r, 0, Math.PI * 2)
        const color = isActive ? '46, 204, 113' : '27, 122, 61'
        ctx.fillStyle = `rgba(${color}, ${Math.min(alpha, 1)})`
        ctx.fill()
      }
    }

    animRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [nodeCount, relCount])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full"
      style={{ pointerEvents: 'none' }}
    />
  )
}
