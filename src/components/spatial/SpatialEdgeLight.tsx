import { motion, useTransform } from 'framer-motion'
import { useSpatialContext } from './SpatialDepthProvider'

/**
 * A subtle directional light gradient overlay that follows device tilt.
 *
 * Simulates light hitting the "glass" viewport from an angle - as you tilt
 * your phone or move your mouse, a soft highlight shifts across the screen.
 * This is what makes the interface feel like a physical transparent surface
 * rather than a flat screen.
 *
 * Sits behind content (z-[1]) but above the aurora background.
 */
export function SpatialEdgeLight() {
  const { tiltX, tiltY } = useSpatialContext()

  // Light source position follows tilt - moves to the edge you're tilting toward
  const lightX = useTransform(tiltX, (v) => 50 + v * 40)
  const lightY = useTransform(tiltY, (v) => 50 + v * 40)

  // Build gradient string from light position
  const background = useTransform(
    [lightX, lightY],
    ([x, y]: number[]) =>
      `radial-gradient(ellipse at ${x}% ${y}%, rgba(255, 255, 255, 0.04), rgba(46, 204, 113, 0.01) 40%, transparent 70%)`,
  )

  // Opacity increases when tilted - more angle = more glare
  const opacity = useTransform(
    [tiltX, tiltY],
    ([x, y]: number[]) => Math.sqrt(x * x + y * y) * 0.8,
  )

  return (
    <motion.div
      className="fixed inset-0 z-[1] pointer-events-none"
      style={{
        background,
        opacity,
      }}
    />
  )
}
