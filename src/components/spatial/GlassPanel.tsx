import { useRef } from 'react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSpatialContext } from './SpatialDepthProvider'

type GlassDepth = 'surface' | 'elevated' | 'floating' | 'deep'

interface GlassPanelProps {
  depth?: GlassDepth
  parallax?: boolean
  holo?: boolean
  /** Z-depth in the spatial scene. Positive = closer. Affects gyro/mouse parallax. */
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

/** Pixels of lateral shift per unit of z-depth at full tilt */
const Z_PARALLAX_FACTOR = 0.3

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

  // ── Local mouse parallax (hover-only, desktop) ──
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const localRotateX = useSpring(useTransform(mouseY, [0, 1], [2.5, -2.5]), {
    stiffness: 60,
    damping: 18,
  })
  const localRotateY = useSpring(useTransform(mouseX, [0, 1], [-2.5, 2.5]), {
    stiffness: 60,
    damping: 18,
  })

  // ── Global spatial tilt (gyro/mouse from SpatialDepthProvider) ──
  // Panels at higher Z shift more, creating depth separation
  const spatialX = useTransform(tiltX, (v) => v * z * Z_PARALLAX_FACTOR)
  const spatialY = useTransform(tiltY, (v) => v * z * Z_PARALLAX_FACTOR)

  // Ambient tilt from global scene — subtle rotation follows device/mouse
  const ambientRotateX = useTransform(tiltY, (v) => v * -1.2)
  const ambientRotateY = useTransform(tiltX, (v) => v * 1.2)

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

  // Combine local hover parallax with global spatial tilt
  const hasLocalParallax = parallax
  const hasSpatialDepth = z !== 0

  return (
    <motion.div
      ref={ref}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        // Local mouse parallax (desktop hover)
        ...(hasLocalParallax
          ? { rotateX: localRotateX, rotateY: localRotateY, transformPerspective: 800 }
          : {}),
        // Global spatial shift from z-depth
        ...(hasSpatialDepth ? { x: spatialX, y: spatialY } : {}),
        // Ambient rotation from gyro/mouse (all panels, subtle)
        ...(!hasLocalParallax
          ? { rotateX: ambientRotateX, rotateY: ambientRotateY, transformPerspective: 1000 }
          : {}),
        translateZ: z,
      }}
      whileHover={
        hasLocalParallax
          ? {
              y: -3,
              boxShadow: '0 32px 72px -18px rgba(0, 104, 122, 0.08)',
              transition: { type: 'spring', stiffness: 100, damping: 20 },
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
