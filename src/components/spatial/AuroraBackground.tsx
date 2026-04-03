import { useLocation } from 'react-router-dom'
import { motion, useTransform, useMotionValueEvent, type MotionValue } from 'framer-motion'
import { getScene } from './spatialConfig'
import { useSpatialContext } from './SpatialDepthProvider'
import { useMetabolicContext } from './MetabolicProvider'
import { useFocusStore } from '@/store/focusStore'
import { useMemo, useRef, useEffect, useCallback } from 'react'

/** How many pixels the orbs shift at full tilt (negative = parallax counterdrift) */
const ORB_DRIFT = -15

/** Base breathing durations per orb index (seconds) */
const BASE_DURATIONS = [6, 8, 10]

/** Orb position transitions: scene change (slow) vs focus change (faster) */
const sceneSpring = { type: 'spring' as const, stiffness: 25, damping: 12, mass: 1.2 }
const focusEnterSpring = { type: 'spring' as const, stiffness: 70, damping: 18, mass: 1.1 }

/** Individual orb that receives pre-computed drift motion values */
function AuroraOrb({
  orb,
  index,
  driftX,
  driftY,
  focused,
}: {
  orb: { color: string; x: string; y: string; size: string }
  index: number
  driftX: MotionValue<number>
  driftY: MotionValue<number>
  focused: boolean
}) {
  const { breathScale } = useMetabolicContext()
  const breathRef = useRef<HTMLDivElement>(null)

  // Each orb drifts at a slightly different multiplier for depth stagger
  // Focus mode flattens parallax to 60%
  const scale = 1 + index * 0.3
  const focusMult = focused ? 0.6 : 1
  const x = useTransform(driftX, (v) => v * scale * focusMult)
  const y = useTransform(driftY, (v) => v * scale * focusMult)

  // Derive this orb's breathing duration from metabolic pressure
  const baseDuration = BASE_DURATIONS[index] ?? 8
  const duration = useTransform(breathScale, (s: number) => baseDuration * s)

  // Imperatively update CSS animation-duration — zero re-renders
  useMotionValueEvent(duration, 'change', (d) => {
    if (breathRef.current) {
      breathRef.current.style.animationDuration = `${d}s`
    }
  })

  // Focus: orb 0 stays, centers on 50%/50%. Others fade to 50% opacity.
  const focusOpacity = focused && index > 0 ? 0.5 : 1
  const focusX = focused && index === 0 ? '50%' : orb.x
  const focusY = focused && index === 0 ? '50%' : orb.y

  return (
    <motion.div
      className="absolute rounded-full"
      animate={{
        left: focusX,
        top: focusY,
        width: orb.size,
        height: orb.size,
        opacity: focusOpacity,
      }}
      transition={focused ? focusEnterSpring : sceneSpring}
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

/** System heartbeat: 12s sinusoidal opacity cycle, +/-2%.
 *  Stops on WS disconnect. Reconnect = stronger first pulse. */
const HEARTBEAT_PERIOD = 12_000
const HEARTBEAT_AMPLITUDE = 0.02
const RECONNECT_BOOST = 0.04 // first pulse after reconnect is 2x stronger

export function AuroraBackground() {
  const location = useLocation()
  const scene = useMemo(() => getScene(location.pathname), [location.pathname])
  const { tiltX, tiltY } = useSpatialContext()
  const { warmth, auroraSaturation, auroraIntensity } = useMetabolicContext()
  const focused = useFocusStore((s) => s.focused)
  const auroraRef = useRef<HTMLDivElement>(null)
  const heartbeatRef = useRef<{ connected: boolean; boosted: boolean; raf: number }>({
    connected: false,
    boosted: false,
    raf: 0,
  })

  const driftX = useTransform(tiltX, (v) => v * ORB_DRIFT)
  const driftY = useTransform(tiltY, (v) => v * ORB_DRIFT)

  // Color temperature + saturation from five-tier pressure system
  // warmth: cool(0) → amber(1), auroraSaturation: vivid(1.3) → compressed(0.5)
  const filter = useTransform(
    [warmth, auroraSaturation],
    ([w, sat]: number[]) => `hue-rotate(${w * -20}deg) saturate(${sat})`,
  )

  // Aurora intensity dims under high pressure (survival tier)
  useMotionValueEvent(auroraIntensity, 'change', (intensity) => {
    if (auroraRef.current) {
      // Apply as a multiplier on top of heartbeat opacity
      auroraRef.current.dataset.intensityMult = String(intensity)
    }
  })

  // Imperatively update CSS filter — zero re-renders
  useMotionValueEvent(filter, 'change', (f) => {
    if (auroraRef.current) auroraRef.current.style.filter = f
  })

  // ─── System Heartbeat ─────────────────────────────────────────────
  const tickHeartbeat = useCallback((t: number) => {
    const hb = heartbeatRef.current
    if (!hb.connected || !auroraRef.current) return

    const amp = hb.boosted ? RECONNECT_BOOST : HEARTBEAT_AMPLITUDE
    // Fade boost back to normal over ~one cycle
    if (hb.boosted) {
      const elapsed = t % HEARTBEAT_PERIOD
      if (elapsed < 100) hb.boosted = false
    }

    const phase = (t % HEARTBEAT_PERIOD) / HEARTBEAT_PERIOD
    const pulse = 1 + amp * Math.sin(phase * Math.PI * 2)
    // Multiply by pressure-tier intensity (Growth=1.0, Survival=0.4)
    const intensityMult = parseFloat(auroraRef.current.dataset.intensityMult || '1')
    auroraRef.current.style.opacity = String(pulse * intensityMult)

    hb.raf = requestAnimationFrame(tickHeartbeat)
  }, [])

  useEffect(() => {
    const hb = heartbeatRef.current

    const handler = (e: Event) => {
      const state = (e as CustomEvent).detail as string
      if (state === 'connected') {
        if (!hb.connected) hb.boosted = true // reconnect boost
        hb.connected = true
        hb.raf = requestAnimationFrame(tickHeartbeat)
      } else {
        hb.connected = false
        cancelAnimationFrame(hb.raf)
        // Heartbeat stops — opacity settles at 1
        if (auroraRef.current) auroraRef.current.style.opacity = '1'
      }
    }

    window.addEventListener('ecodia:connection-state', handler)
    return () => {
      window.removeEventListener('ecodia:connection-state', handler)
      cancelAnimationFrame(hb.raf)
    }
  }, [tickHeartbeat])

  // ─── Homecoming: warm→cool aurora shift during wake ──────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const phase = (e as CustomEvent).detail?.phase
      if (phase === 'start' && auroraRef.current) {
        // Start warm (accumulated heat) — hue shift toward amber
        auroraRef.current.style.filter = 'hue-rotate(-25deg) saturate(1.4)'
        // Gradually cool back to normal over 15s
        auroraRef.current.style.transition = 'filter 15s cubic-bezier(0.22, 1, 0.36, 1)'
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (auroraRef.current) {
              auroraRef.current.style.filter = ''
            }
          })
        })
      } else if (phase === 'end' && auroraRef.current) {
        // Ensure clean state
        auroraRef.current.style.transition = ''
        auroraRef.current.style.filter = ''
      }
    }

    window.addEventListener('ecodia:homecoming-drift', handler)
    return () => window.removeEventListener('ecodia:homecoming-drift', handler)
  }, [])

  return (
    <div ref={auroraRef} className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-surface" />

      {scene.aurora.orbs.map((orb, i) => (
        <AuroraOrb key={i} orb={orb} index={i} driftX={driftX} driftY={driftY} focused={focused} />
      ))}
    </div>
  )
}
