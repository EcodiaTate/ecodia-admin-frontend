import { motion, useTransform } from 'framer-motion'
import { useMousePosition } from '@/hooks/useMousePosition'
import { useSpatialContext } from './SpatialDepthProvider'

/**
 * Cursor-following glow that also responds to spatial tilt.
 * On desktop: follows mouse position with tilt-driven size/intensity shift.
 * Creates the illusion of a light source illuminating the glass panels.
 */
export function CursorGlow() {
  const { mouseX, mouseY } = useMousePosition()
  const { tiltX, tiltY } = useSpatialContext()

  // Glow size pulses slightly with tilt magnitude — moving = more energy
  const scale = useTransform(
    [tiltX, tiltY],
    ([x, y]: number[]) => 1 + Math.sqrt(x * x + y * y) * 0.15,
  )

  // Slight offset from tilt — glow drifts ahead of cursor direction
  const offsetX = useTransform(tiltX, (v) => v * 20)
  const offsetY = useTransform(tiltY, (v) => v * 20)

  // Opacity intensifies slightly with movement
  const opacity = useTransform(
    [tiltX, tiltY],
    ([x, y]: number[]) => 0.6 + Math.sqrt(x * x + y * y) * 0.3,
  )

  return (
    <motion.div
      className="fixed pointer-events-none z-[2]"
      style={{
        x: mouseX,
        y: mouseY,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.05), rgba(0, 104, 122, 0.025) 35%, transparent 65%)',
        transform: 'translate(-50%, -50%)',
        filter: 'blur(1px)',
        scale,
        opacity,
        translateX: offsetX,
        translateY: offsetY,
      }}
    />
  )
}
