import { motion, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSpatialContext } from './SpatialDepthProvider'

/**
 * Wraps any element and positions it at a specific Z-depth in the spatial scene.
 *
 * Elements at positive Z feel closer (move MORE with tilt).
 * Elements at negative Z feel further (move LESS / opposite with tilt).
 * Elements at Z=0 are the neutral plane (no parallax shift).
 *
 * The parallax displacement is proportional to the Z value, creating
 * real depth separation when the user tilts their phone or moves their mouse.
 *
 * Usage:
 *   <SpatialLayer z={30}>   ← header floats close
 *     <h1>Title</h1>
 *   </SpatialLayer>
 *
 *   <SpatialLayer z={0}>    ← content sits at ground plane
 *     <GlassPanel>...</GlassPanel>
 *   </SpatialLayer>
 *
 *   <SpatialLayer z={-20}>  ← background element recedes
 *     <div className="bg-pattern" />
 *   </SpatialLayer>
 */

interface SpatialLayerProps {
  /** Z-depth in pixels. Positive = closer, negative = further. */
  z: number
  /** Extra classes */
  className?: string
  children: React.ReactNode
  /** HTML element type */
  as?: 'div' | 'section' | 'header' | 'footer' | 'aside' | 'main'
}

/** How many pixels of lateral shift per unit of Z-depth at full tilt */
const PARALLAX_INTENSITY = 0.4

export function SpatialLayer({ z, className, children, as = 'div' }: SpatialLayerProps) {
  const { tiltX, tiltY } = useSpatialContext()

  // At z=30, full tilt (1.0) → 12px shift. At z=-20 → -8px shift (opposite).
  const x = useTransform(tiltX, (v) => v * z * PARALLAX_INTENSITY)
  const y = useTransform(tiltY, (v) => v * z * PARALLAX_INTENSITY)

  const Component = motion[as]

  return (
    <Component
      className={cn('will-change-transform', className)}
      style={{
        x,
        y,
        // Actual CSS translateZ for preserve-3d depth
        translateZ: z,
      }}
    >
      {children}
    </Component>
  )
}
