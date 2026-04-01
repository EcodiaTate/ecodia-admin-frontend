import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getScene } from './spatialConfig'
import { useMemo } from 'react'

const orbTransition = {
  type: 'spring' as const,
  stiffness: 25,
  damping: 12,
  mass: 1.2,
}

export function AuroraBackground() {
  const location = useLocation()
  const scene = useMemo(() => getScene(location.pathname), [location.pathname])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Base surface */}
      <div className="absolute inset-0 bg-surface" />

      {/* Aurora orbs — react to active scene */}
      {scene.aurora.orbs.map((orb, i) => (
        <motion.div
          key={i}
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
          }}
        >
          {/* Inner breathing animation */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 6 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              background: `radial-gradient(ellipse at center, ${orb.color}, transparent 50%)`,
            }}
          />
        </motion.div>
      ))}
    </div>
  )
}
