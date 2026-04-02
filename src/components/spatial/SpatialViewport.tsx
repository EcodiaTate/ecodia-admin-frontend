import { motion, useTransform } from 'framer-motion'
import { useSpatialContext } from './SpatialDepthProvider'

/**
 * The root 3D viewport that responds to device tilt / mouse position.
 *
 * Shifts perspective-origin based on tilt, so every child with a translateZ
 * automatically moves in parallax. Real CSS 3D perspective, not a 2D hack.
 */

/** How far the perspective origin shifts from center (in %) at full tilt */
const ORIGIN_RANGE = 8

export function SpatialViewport({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { tiltX, tiltY } = useSpatialContext()

  // Combine into a single perspectiveOrigin string
  const perspectiveOrigin = useTransform(
    [tiltX, tiltY],
    ([x, y]: number[]) => `${50 + x * ORIGIN_RANGE}% ${50 + y * ORIGIN_RANGE}%`,
  )

  return (
    <motion.div
      className={className}
      style={{
        position: 'fixed' as const,
        inset: 0,
        perspective: 1200,
        perspectiveOrigin,
        overflow: 'hidden' as const,
      }}
    >
      {children}
    </motion.div>
  )
}
