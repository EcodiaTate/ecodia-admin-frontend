import { useRef } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSpatialContext } from './SpatialDepthProvider'

type GlassDepth = 'surface' | 'elevated' | 'floating' | 'deep'

interface GlassPanelProps {
  depth?: GlassDepth
  parallax?: boolean
  holo?: boolean
  /** Z-depth in the spatial scene. Positive = closer. */
  z?: number
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

const Z_PARALLAX = 0.5

export function GlassPanel({
  depth = 'surface',
  parallax = false,
  holo = false,
  z = 0,
  className,
  children,
  onClick,
}: GlassPanelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { tiltX, tiltY } = useSpatialContext()

  // ── Local mouse parallax (hover, desktop) ──
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  const localRotateX = useSpring(useTransform(mouseY, [0, 1], [3.5, -3.5]), {
    stiffness: 50,
    damping: 15,
  })
  const localRotateY = useSpring(useTransform(mouseX, [0, 1], [-3.5, 3.5]), {
    stiffness: 50,
    damping: 15,
  })

  // ── Global spatial tilt ──
  const spatialX = useTransform(tiltX, (v) => v * z * Z_PARALLAX)
  const spatialY = useTransform(tiltY, (v) => v * z * Z_PARALLAX)

  // Ambient tilt — ALL glass panels breathe with the scene, not just parallax ones
  // ±2.5° rotation is perceptible but still elegant
  const ambientRotateX = useTransform(tiltY, (v) => v * -2.5)
  const ambientRotateY = useTransform(tiltX, (v) => v * 2.5)

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

  const hasSpatialDepth = z !== 0

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        // Local mouse parallax overrides ambient when active
        rotateX: parallax ? localRotateX : ambientRotateX,
        rotateY: parallax ? localRotateY : ambientRotateY,
        transformPerspective: parallax ? 600 : 900,
        // Z-depth shift
        ...(hasSpatialDepth ? { x: spatialX, y: spatialY } : {}),
        translateZ: z,
      }}
      whileHover={
        parallax
          ? {
              y: -4,
              boxShadow: '0 36px 80px -18px rgba(0, 104, 122, 0.10)',
              transition: { type: 'spring', stiffness: 80, damping: 18 },
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
