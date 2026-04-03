import { createContext, useContext } from 'react'
import { type MotionValue, motionValue } from 'framer-motion'
import { useSpatialDepth } from '@/hooks/useSpatialDepth'

interface SpatialDepthContext {
  tiltX: MotionValue<number>
  tiltY: MotionValue<number>
  hasGyroscope: boolean
}

// Static zero - used when provider is missing (no hook call needed)
const ZERO = motionValue(0)
const FALLBACK: SpatialDepthContext = { tiltX: ZERO, tiltY: ZERO, hasGyroscope: false }

const Ctx = createContext<SpatialDepthContext>(FALLBACK)

/**
 * Provides unified tilt values (gyro on mobile, mouse on desktop)
 * to all spatial components in the tree - SpatialLayer, GlassPanel,
 * AuroraBackground, viewport perspective-origin.
 *
 * Mount once in AppShell, above all spatial consumers.
 */
export function SpatialDepthProvider({ children }: { children: React.ReactNode }) {
  const depth = useSpatialDepth()

  return <Ctx.Provider value={depth}>{children}</Ctx.Provider>
}

export function useSpatialContext(): SpatialDepthContext {
  return useContext(Ctx)
}
