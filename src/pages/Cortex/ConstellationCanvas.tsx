import { useRef, useEffect } from 'react'

interface Props {
  nodeCount: number
  relCount: number
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
}

export function ConstellationCanvas({ nodeCount, relCount }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const animRef = useRef<number>(0)

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

    // Generate stars based on node count (clamped)
    const starCount = Math.min(Math.max(nodeCount, 30), 120)
    const stars: Star[] = []
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        radius: Math.random() * 1.5 + 0.5,
        brightness: Math.random() * 0.4 + 0.1,
        breatheOffset: Math.random() * Math.PI * 2,
        breatheSpeed: Math.random() * 0.0008 + 0.0004,
      })
    }
    starsRef.current = stars

    // Connection distance threshold scales with relationship density
    const connectionDist = Math.min(120 + relCount * 0.3, 200)

    function draw(time: number) {
      if (!ctx || !canvas) return
      const w = window.innerWidth
      const h = window.innerHeight

      ctx.clearRect(0, 0, w, h)

      // Update positions
      for (const star of stars) {
        star.x += star.vx
        star.y += star.vy

        // Wrap around edges
        if (star.x < 0) star.x = w
        if (star.x > w) star.x = 0
        if (star.y < 0) star.y = h
        if (star.y > h) star.y = 0
      }

      // Draw connections
      for (let i = 0; i < stars.length; i++) {
        for (let j = i + 1; j < stars.length; j++) {
          const dx = stars[i].x - stars[j].x
          const dy = stars[i].y - stars[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectionDist) {
            const opacity = (1 - dist / connectionDist) * 0.06
            ctx.beginPath()
            ctx.moveTo(stars[i].x, stars[i].y)
            ctx.lineTo(stars[j].x, stars[j].y)
            ctx.strokeStyle = `rgba(0, 104, 122, ${opacity})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      // Draw stars
      for (const star of stars) {
        const breathe = Math.sin(time * star.breatheSpeed + star.breatheOffset) * 0.5 + 0.5
        const alpha = star.brightness * (0.6 + breathe * 0.4)
        const r = star.radius * (0.8 + breathe * 0.4)

        // Glow
        const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, r * 4)
        gradient.addColorStop(0, `rgba(0, 104, 122, ${alpha * 0.3})`)
        gradient.addColorStop(1, 'rgba(0, 104, 122, 0)')
        ctx.beginPath()
        ctx.arc(star.x, star.y, r * 4, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Core
        ctx.beginPath()
        ctx.arc(star.x, star.y, r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 104, 122, ${alpha})`
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(draw)
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
