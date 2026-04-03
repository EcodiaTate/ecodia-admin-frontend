import { createContext, useContext, useEffect } from 'react'
import { motionValue } from 'framer-motion'
import { useMetabolicPressure, type MetabolicValues } from '@/hooks/useMetabolicPressure'

// Static fallback — zero pressure, all modulators at calm defaults (Growth tier)
const ZERO = motionValue(0)
const ONE = motionValue(1)
const GROWTH_BREATH = motionValue(1.2)
const GROWTH_DRIFT = motionValue(0.6)
const GROWTH_SAT = motionValue(1.3)
const GROWTH_GLASS = motionValue(0.45)
const GROWTH_CONSTELLATION = motionValue(0.5)

const FALLBACK: MetabolicValues = {
  pressure: ZERO,
  breathScale: GROWTH_BREATH,
  driftScale: GROWTH_DRIFT,
  stiffnessBoost: ZERO,
  warmth: ZERO,
  auroraSaturation: GROWTH_SAT,
  auroraIntensity: ONE,
  glassOpacity: GROWTH_GLASS,
  particleGravity: ZERO,
  constellationVisibility: GROWTH_CONSTELLATION,
}

const Ctx = createContext<MetabolicValues>(FALLBACK)

/**
 * Provides metabolic pressure as MotionValues to the entire spatial tree.
 *
 * Mount once in AppShell, above SpatialDepthProvider.
 * All consumers read derived MotionValues — zero re-renders.
 *
 * The organism's temporal_pressure flows:
 *   WebSocket → wsManager.broadcast → useWebSocket handler
 *   → CustomEvent → MetabolicProvider listener → spring-smoothed pressure
 *   → useTransform derivatives → every aurora, particle, spring in the UI
 */
export function MetabolicProvider({ children }: { children: React.ReactNode }) {
  const metabolic = useMetabolicPressure()
  const setter = (metabolic as MetabolicValues & { _setRaw?: (v: number) => void })._setRaw

  // Listen for metabolic pressure events from the WebSocket handler
  useEffect(() => {
    if (!setter) return
    const handler = (e: Event) => {
      const pressure = (e as CustomEvent).detail?.pressure
      if (typeof pressure === 'number') setter(pressure)
    }
    window.addEventListener('ecodia:metabolic-pressure', handler)
    return () => window.removeEventListener('ecodia:metabolic-pressure', handler)
  }, [setter])

  return <Ctx.Provider value={metabolic}>{children}</Ctx.Provider>
}

export function useMetabolicContext(): MetabolicValues {
  return useContext(Ctx)
}
