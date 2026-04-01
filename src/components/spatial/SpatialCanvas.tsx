import { useRef, cloneElement, isValidElement, useCallback } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getSceneKey, getTransitionDirection } from './spatialConfig'

/**
 * The spatial canvas renders route content with directional 3D transitions.
 *
 * Key design: both the entering and exiting scene use full-viewport offsets
 * (110vw/vh) so content genuinely slides off-screen in the direction of
 * travel. The brief crossfade moment — where both are partially visible
 * with blur — creates the "same holographic plane" illusion.
 *
 * Direction is computed dynamically from the *actual* previous scene,
 * so Dashboard→Finance→Gmail produces different vectors than Dashboard→Gmail.
 */
export function SpatialCanvas() {
  const location = useLocation()
  const outlet = useOutlet()

  const sceneKey = getSceneKey(location.pathname)

  // Track the *last committed* scene so exit animations know which
  // direction to leave. Updated only when the scene key actually changes.
  const prevSceneRef = useRef(sceneKey)
  const directionRef = useRef(getTransitionDirection(location.pathname, location.pathname))

  // When scene changes, snapshot the direction before the new scene mounts
  if (sceneKey !== prevSceneRef.current) {
    directionRef.current = getTransitionDirection(
      // from: the scene we're leaving
      '/' + prevSceneRef.current,
      // to: the scene we're entering
      location.pathname,
    )
    prevSceneRef.current = sceneKey
  }

  const variants = directionRef.current

  // Memoize the outlet clone to prevent re-render during exit
  const clonedOutlet = useCallback(() => {
    if (isValidElement(outlet)) return cloneElement(outlet)
    return outlet
  }, [outlet])

  return (
    <div className="spatial-viewport z-20">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={sceneKey}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          className="scene-container"
          style={{ willChange: 'transform, opacity, filter' }}
        >
          {clonedOutlet()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
