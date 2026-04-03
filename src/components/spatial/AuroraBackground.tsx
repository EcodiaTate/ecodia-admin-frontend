import { useLocation } from 'react-router-dom'
import { motion, useTransform, useMotionValueEvent, type MotionValue } from 'framer-motion'
import { getScene } from './spatialConfig'
import { useSpatialContext } from './SpatialDepthProvider'
import { useMetabolicContext } from './MetabolicProvider'
import { useMemo, useRef } from 'react'

const orbTransition = {
  type: 'spring' as const,
  stiffness: 25,
  damping: 12,
  mass: 1.2,
}

/** How many pixels the orbs shift at full tilt (negative = parallax counterdrift) */
const ORB_DRIFT = -15

/** Base breathing durations per orb index (seconds) */
const BASE_DURATIONS = [6, 8, 10]

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
  const { breathScale } = useMetabolicContext()
  const breathRef = useRef<HTMLDivElement>(null)

  // Each orb drifts at a slightly different multiplier for depth stagger
  const scale = 1 + index * 0.3
  const x = useTransform(driftX, (v) => v * scale)
  const y = useTransform(driftY, (v) => v * scale)

  // Derive this orb's breathing duration from metabolic pressure
  // breathScale: 1.0 (calm) → 0.4 (urgent)
  // So duration = baseDuration * breathScale
  const baseDuration = BASE_DURATIONS[index] ?? 8
  const duration = useTransform(breathScale, (s: number) => baseDuration * s)

  // Imperatively update CSS animation-duration — zero re-renders
  useMotionValueEvent(duration, 'change', (d) => {
    if (breathRef.current) {
      breathRef.current.style.animationDuration = `${d}s`
    }
  })

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
      <div
        ref={breathRef}
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(ellipse at center, ${orb.color}, transparent 50%)`,
          animation: `aurora-breathe ${baseDuration}s cubic-bezier(0.42, 0, 0.58, 1) infinite`,
        }}
      />
    </motion.div>
  )
}

export function AuroraBackground() {
  const location = useLocation()
  const scene = useMemo(() => getScene(location.pathname), [location.pathname])
  const { tiltX, tiltY } = useSpatialContext()
  const { warmth } = useMetabolicContext()
  const auroraRef = useRef<HTMLDivElement>(null)

  const driftX = useTransform(tiltX, (v) => v * ORB_DRIFT)
  const driftY = useTransform(tiltY, (v) => v * ORB_DRIFT)

  // Color temperature shift: warmth 0→1 maps to hue-rotate(-15deg) + saturate(1.3)
  // Greens shift toward gold/amber, saturation increases — UI "heats up"
  const filter = useTransform(
    warmth,
    (w: number) => `hue-rotate(${w * -15}deg) saturate(${1 + w * 0.3})`,
  )

  // Imperatively update CSS filter — zero re-renders
  useMotionValueEvent(filter, 'change', (f) => {
    if (auroraRef.current) auroraRef.current.style.filter = f
  })

  return (
    <div ref={auroraRef} className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-surface" />

      {scene.aurora.orbs.map((orb, i) => (
        <AuroraOrb key={i} orb={orb} index={i} driftX={driftX} driftY={driftY} />
      ))}
    </div>
  )
}
