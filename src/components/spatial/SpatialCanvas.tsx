import { useRef, cloneElement, isValidElement } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getSceneKey, getTransitionDirection } from './spatialConfig'

export function SpatialCanvas() {
  const location = useLocation()
  const outlet = useOutlet()
  const prevPathRef = useRef(location.pathname)

  const sceneKey = getSceneKey(location.pathname)
  const prevSceneKey = getSceneKey(prevPathRef.current)

  // Only compute direction when scene actually changes
  const variants = sceneKey !== prevSceneKey
    ? getTransitionDirection(prevPathRef.current, location.pathname)
    : getTransitionDirection(location.pathname, location.pathname)

  // Update prev path after computing variants
  if (sceneKey !== prevSceneKey) {
    prevPathRef.current = location.pathname
  }

  return (
    <div className="spatial-viewport z-20">
      {/* popLayout lets both scenes exist simultaneously during crossfade —
          the exiting scene ghosts away while the entering scene slides in,
          creating the illusion of a single continuous plane */}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={sceneKey}
          initial={variants.initial}
          animate={variants.animate}
          exit={variants.exit}
          className="scene-container"
          style={{ willChange: 'transform, opacity, filter' }}
        >
          {isValidElement(outlet) ? cloneElement(outlet) : outlet}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
