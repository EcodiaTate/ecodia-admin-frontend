import { useRef } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { getSceneKey, getDirection, sceneVariants } from './spatialConfig'

/**
 * Spatial scene renderer with directional 3D transitions.
 *
 * The critical trick: Framer Motion's `custom` prop is re-evaluated at
 * exit time (not mount time). So we store the current direction vector
 * in a ref and pass the ref's getter as `custom`. When scene 2 exits
 * (even long after it mounted), it reads the *current* direction —
 * which is the fresh 2→1 vector, not the stale 1→2 from mount time.
 *
 * This makes 1→2→pause→1 animate in the correct relative direction.
 */
export function SpatialCanvas() {
  const location = useLocation()
  const outlet = useOutlet()

  const sceneKey = getSceneKey(location.pathname)
  const prevKeyRef = useRef(sceneKey)
  const directionRef = useRef(getDirection(sceneKey, sceneKey))

  // Recompute direction on every scene change
  if (sceneKey !== prevKeyRef.current) {
    directionRef.current = getDirection(prevKeyRef.current, sceneKey)
    prevKeyRef.current = sceneKey
  }

  // `custom` is read by AnimatePresence at exit time, not mount time.
  // This is what fixes the "pause then go back" direction problem.
  const direction = directionRef.current

  return (
    <div className="spatial-viewport z-20">
      <AnimatePresence mode="popLayout" initial={false} custom={direction}>
        <motion.div
          key={sceneKey}
          custom={direction}
          variants={sceneVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="scene-container"
          style={{ willChange: 'transform, opacity' }}
        >
          {outlet}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
