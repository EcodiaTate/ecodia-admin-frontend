import { useRef } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'

type GlassDepth = 'surface' | 'elevated' | 'floating' | 'deep'

interface GlassPanelProps {
  depth?: GlassDepth
  parallax?: boolean
  holo?: boolean
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

const depthClasses: Record<GlassDepth, string> = {
  surface: 'glass',
  elevated: 'glass-elevated',
  floating: 'glass-floating',
  deep: 'glass-deep',
}

export function GlassPanel({
  depth = 'surface',
  parallax = false,
  holo = false,
  className,
  children,
  onClick,
}: GlassPanelProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Raw mouse position over the element (0 = left/top edge, 1 = right/bottom edge)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  // Spring-smoothed rotation (max 2.5 degrees)
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [2.5, -2.5]), {
    stiffness: 150,
    damping: 20,
  })
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-2.5, 2.5]), {
    stiffness: 150,
    damping: 20,
  })

  function handleMouseMove(e: React.MouseEvent) {
    if (!parallax || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
  }

  function handleMouseLeave() {
    if (!parallax) return
    mouseX.set(0.5)
    mouseY.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={parallax ? { rotateX, rotateY, transformPerspective: 800 } : undefined}
      whileHover={
        parallax
          ? {
              y: -3,
              boxShadow: '0 32px 72px -18px rgba(0, 104, 122, 0.08)',
              transition: { type: 'spring', stiffness: 300, damping: 22 },
            }
          : undefined
      }
      className={cn(
        depthClasses[depth],
        'rounded-3xl',
        holo && 'holo-border',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}
