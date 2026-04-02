import { useLocation } from 'react-router-dom'
import { motion, useTransform, type MotionValue } from 'framer-motion'
import { getScene } from './spatialConfig'
import { useSpatialContext } from './SpatialDepthProvider'
import { useMemo } from 'react'

const orbTransition = {
  type: 'spring' as const,
  stiffness: 25,
  damping: 12,
  mass: 1.2,
}

/** How many pixels the orbs shift at full tilt (negative = parallax counterdrift) */
const ORB_DRIFT = -15

/** Individual orb that receives pre-computed drift motion values */
function AuroraOrb({
  orb,
  index,
  driftX,
  driftY,
}: {
  orb: { color: string; x: string; y: string; size: string }
  index: number
  driftX: MotionValue<number>
  driftY: MotionValue<number>
}) {
  // Each orb drifts at a slightly different multiplier for depth stagger
  const scale = 1 + index * 0.3
  const x = useTransform(driftX, (v) => v * scale)
  const y = useTransform(driftY, (v) => v * scale)

  return (
    <motion.div
      className="absolute rounded-full"
      animate={{
        left: orb.x,
        top: orb.y,
        width: orb.size,
        height: orb.size,
        opacity: 1,
      }}
      transition={orbTransition}
      style={{
        background: `radial-gradient(ellipse at center, ${orb.color}, transparent 50%)`,
        transform: 'translate(-50%, -50%)',
        x,
        y,
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{
          duration: 6 + index * 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: `radial-gradient(ellipse at center, ${orb.color}, transparent 50%)`,
        }}
      />
    </motion.div>
  )
}

export function AuroraBackground() {
  const location = useLocation()
  const scene = useMemo(() => getScene(location.pathname), [location.pathname])
  const { tiltX, tiltY } = useSpatialContext()

  const driftX = useTransform(tiltX, (v) => v * ORB_DRIFT)
  const driftY = useTransform(tiltY, (v) => v * ORB_DRIFT)

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-surface" />

      {scene.aurora.orbs.map((orb, i) => (
        <AuroraOrb key={i} orb={orb} index={i} driftX={driftX} driftY={driftY} />
      ))}
    </div>
  )
}
