import { useEffect, useRef, useCallback } from 'react'
import { motion, useTransform, useSpring } from 'framer-motion'
import { useSpatialContext } from './SpatialDepthProvider'
import { getScene, getSceneKey } from './spatialConfig'
import { useLocation } from 'react-router-dom'

// ─── Edge Whispers ───────────────────────────────────────────────────
// Events in off-screen scenes bias the edge light toward that scene's
// spatial direction. Holds 10s, spring-decays back.
// Light comes from where the event lives.

const WHISPER_HOLD_MS = 10_000
const WHISPER_SPRING = { stiffness: 30, damping: 15, mass: 1 }

/**
 * A subtle directional light gradient overlay that follows device tilt
 * and biases toward off-screen scenes when events arrive there.
 */
export function SpatialEdgeLight() {
  const { tiltX, tiltY } = useSpatialContext()
  const location = useLocation()
  const currentScene = getSceneKey(location.pathname)

  // Edge whisper bias — spring-animated offset added to tilt
  const whisperX = useSpring(0, WHISPER_SPRING)
  const whisperY = useSpring(0, WHISPER_SPRING)
  const whisperTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerWhisper = useCallback((sceneKey: string) => {
    if (sceneKey === currentScene) return // don't whisper for current scene

    const from = getScene(`/${currentScene}`)
    const to = getScene(`/${sceneKey}`)

    // Direction from current scene to event scene
    const dx = to.position.x - from.position.x
    const dy = to.position.y - from.position.y
    const mag = Math.sqrt(dx * dx + dy * dy) || 1

    // Bias the light 15-25% toward the event direction
    whisperX.set((dx / mag) * 0.2)
    whisperY.set((dy / mag) * 0.2)

    // Clear existing decay timer
    if (whisperTimerRef.current) clearTimeout(whisperTimerRef.current)

    // Hold for 10s then spring-decay back
    whisperTimerRef.current = setTimeout(() => {
      whisperX.set(0)
      whisperY.set(0)
    }, WHISPER_HOLD_MS)
  }, [currentScene, whisperX, whisperY])

  // Listen for events that should trigger whispers
  useEffect(() => {
    const onActionQueue = () => triggerWhisper('dashboard')
    const onOrganism = () => triggerWhisper('knowledge-graph')

    window.addEventListener('ecodia:action-queue-update', onActionQueue)
    window.addEventListener('ecodia:organism-surfacing', onOrganism)
    window.addEventListener('ecodia:metabolic-pressure', onOrganism)

    return () => {
      window.removeEventListener('ecodia:action-queue-update', onActionQueue)
      window.removeEventListener('ecodia:organism-surfacing', onOrganism)
      window.removeEventListener('ecodia:metabolic-pressure', onOrganism)
      if (whisperTimerRef.current) clearTimeout(whisperTimerRef.current)
    }
  }, [triggerWhisper])

  // Light source: tilt + whisper bias
  const lightX = useTransform(
    [tiltX, whisperX],
    ([t, w]: number[]) => 50 + t * 40 + w * 40,
  )
  const lightY = useTransform(
    [tiltY, whisperY],
    ([t, w]: number[]) => 50 + t * 40 + w * 40,
  )

  const background = useTransform(
    [lightX, lightY],
    ([x, y]: number[]) =>
      `radial-gradient(ellipse at ${x}% ${y}%, rgba(255, 255, 255, 0.04), rgba(46, 204, 113, 0.01) 40%, transparent 70%)`,
  )

  // Base opacity from tilt + boost from whisper
  const whisperMag = useTransform(
    [whisperX, whisperY],
    ([wx, wy]: number[]) => Math.sqrt(wx * wx + wy * wy),
  )
  const opacity = useTransform(
    [tiltX, tiltY, whisperMag],
    ([x, y, wm]: number[]) => Math.sqrt(x * x + y * y) * 0.8 + wm * 0.6,
  )

  return (
    <motion.div
      className="fixed inset-0 z-[2] pointer-events-none"
      style={{
        background,
        opacity,
      }}
    />
  )
}
