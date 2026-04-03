import { useState } from 'react'
import { useMotionValueEvent } from 'framer-motion'
import { useMetabolicContext } from '@/components/spatial/MetabolicProvider'

/**
 * Returns a spring config that tightens under metabolic pressure.
 *
 * Pressure is bucketed into 5 tiers (0, 0.25, 0.5, 0.75, 1.0)
 * to avoid re-rendering on every micro-fluctuation.
 * Each tier change causes ONE re-render to reconfigure the spring.
 *
 * At ~1Hz WebSocket updates smoothed through a heavy spring,
 * tier changes happen at most every few seconds — negligible.
 */
export function useMetabolicSpringConfig(base: {
  stiffness: number
  damping: number
  mass: number
}): { stiffness: number; damping: number; mass: number } {
  const { stiffnessBoost } = useMetabolicContext()
  const [tier, setTier] = useState(0)

  // Bucket pressure into 5 tiers to limit re-renders
  useMotionValueEvent(stiffnessBoost, 'change', (boost: number) => {
    // stiffnessBoost: 0→30, so bucket = round(boost/30 * 4) / 4
    const newTier = Math.round((boost / 30) * 4) / 4
    setTier((prev) => (prev !== newTier ? newTier : prev))
  })

  // Derive config from tier (not raw values) to keep reference stable within tier
  return {
    stiffness: base.stiffness + tier * 30,
    damping: base.damping + tier * -4,
    mass: base.mass,
  }
}
