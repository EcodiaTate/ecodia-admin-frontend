import { motion, useTransform } from 'framer-motion'
import { useSpatialContext } from './SpatialDepthProvider'

/**
 * Root 3D viewport - shifts perspective-origin based on tilt.
 * Every child with translateZ automatically separates in parallax.
 *
 * Perspective is set to 800px (closer = more dramatic depth separation).
 * Origin shifts ±15% from center - enough to clearly see depth layers separate.
 */

const PERSPECTIVE = 800
const ORIGIN_RANGE = 15

export function SpatialViewport({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { tiltX, tiltY } = useSpatialContext()

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
        perspective: PERSPECTIVE,
        perspectiveOrigin,
        overflow: 'hidden' as const,
      }}
    >
      {children}
    </motion.div>
  )
}
