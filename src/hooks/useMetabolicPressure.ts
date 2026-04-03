import { useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'

/**
 * Metabolic Pressure Engine — the organism's temporal pressure
 * modulates every animation constant in the UI.
 *
 * pressure = 0.0 → calm: slow breathing, loose springs, cool tones
 * pressure = 1.0 → urgent: fast breathing, tight springs, warm tones
 *
 * Five Pressure Tiers (the "weather" of the interface):
 *   Growth      (0.0–0.2): Spring morning. Vivid aurora, lazy particles, max glass transparency.
 *   Maintenance (0.2–0.4): Clear afternoon. Neutral steady state.
 *   Operations  (0.4–0.6): Light shifts. Aurora desaturates toward teal.
 *   Obligations (0.6–0.8): Late amber. Aurora warms, particles drift down, shadows deepen.
 *   Survival    (0.8–1.0): Still. Aurora nearly stops. Colors compress to narrow amber.
 *
 * Zero re-renders — all values are MotionValues derived via useTransform.
 * The raw pressure is spring-smoothed so transitions feel organic, not jarring.
 */

// Heavy spring — pressure changes should feel like tidal shifts, not twitches
const PRESSURE_SPRING = { stiffness: 8, damping: 15, mass: 3 }

export interface MetabolicValues {
  /** Smoothed pressure 0–1 (MotionValue, never triggers re-render) */
  pressure: MotionValue<number>

  // ─── Derived Animation Modulators ─────────────────────────────────

  /** Aurora breathing duration multiplier: 1.2 (growth) → 0.15 (survival=nearly stopped) */
  breathScale: MotionValue<number>

  /** Particle drift speed multiplier: 0.6 (lazy growth) → 0.1 (survival=stationary) */
  driftScale: MotionValue<number>

  /** Spring stiffness additive offset: 0 (calm) → +30 (urgent) */
  stiffnessBoost: MotionValue<number>

  /** Color temperature shift: 0 (neutral/cool) → 1 (warm amber) */
  warmth: MotionValue<number>

  /** Aurora saturation: 1.3 (vivid growth) → 0.5 (compressed survival) */
  auroraSaturation: MotionValue<number>

  /** Aurora base opacity: 1.0 (growth) → 0.4 (survival=dim) */
  auroraIntensity: MotionValue<number>

  /** Glass opacity multiplier: 0.45 (growth=transparent) → 0.85 (survival=opaque) */
  glassOpacity: MotionValue<number>

  /** Particle vertical drift bias: 0 (neutral) → 1 (downward drift in obligations+) */
  particleGravity: MotionValue<number>

  /** Constellation visibility: 0.5 (growth=subtle) → 1.0 (operations=connections visible) → 0.3 (survival=only active) */
  constellationVisibility: MotionValue<number>
}

/**
 * Five-tier pressure mapping with non-linear curves per tier.
 * Each tier has its own character — not just linear interpolation.
 */
function tierBreathScale(p: number): number {
  if (p <= 0.2) return 1.2 - p * 0.5                  // Growth: 1.2 → 1.1 (slow, lazy)
  if (p <= 0.4) return 1.1 - (p - 0.2) * 1.0          // Maintenance: 1.1 → 0.9 (steady)
  if (p <= 0.6) return 0.9 - (p - 0.4) * 1.5          // Operations: 0.9 → 0.6 (purposeful)
  if (p <= 0.8) return 0.6 - (p - 0.6) * 1.5          // Obligations: 0.6 → 0.3 (concentrated)
  return 0.3 - (p - 0.8) * 0.75                        // Survival: 0.3 → 0.15 (nearly stopped)
}

function tierDriftScale(p: number): number {
  if (p <= 0.2) return 0.6 + p * 1.0                   // Growth: 0.6 → 0.8 (lazy drift)
  if (p <= 0.4) return 0.8 + (p - 0.2) * 2.0           // Maintenance: 0.8 → 1.2 (normal)
  if (p <= 0.6) return 1.2 + (p - 0.4) * 3.0           // Operations: 1.2 → 1.8 (purposeful)
  if (p <= 0.8) return 1.8 - (p - 0.6) * 4.0           // Obligations: 1.8 → 1.0 (slowing)
  return 1.0 - (p - 0.8) * 4.5                         // Survival: 1.0 → 0.1 (stationary)
}

function tierWarmth(p: number): number {
  if (p <= 0.2) return 0                                // Growth: cool/neutral
  if (p <= 0.4) return (p - 0.2) * 0.5                 // Maintenance: 0 → 0.1
  if (p <= 0.6) return 0.1 + (p - 0.4) * 1.5           // Operations: 0.1 → 0.4 (teal shift)
  if (p <= 0.8) return 0.4 + (p - 0.6) * 2.5           // Obligations: 0.4 → 0.9 (amber)
  return 0.9 + (p - 0.8) * 0.5                         // Survival: 0.9 → 1.0 (narrow amber)
}

function tierAuroraSaturation(p: number): number {
  if (p <= 0.2) return 1.3                              // Growth: vivid
  if (p <= 0.4) return 1.3 - (p - 0.2) * 1.5           // Maintenance: 1.3 → 1.0
  if (p <= 0.6) return 1.0 - (p - 0.4) * 1.0           // Operations: 1.0 → 0.8 (desaturating)
  if (p <= 0.8) return 0.8 - (p - 0.6) * 0.75          // Obligations: 0.8 → 0.65
  return 0.65 - (p - 0.8) * 0.75                       // Survival: 0.65 → 0.5
}

function tierAuroraIntensity(p: number): number {
  if (p <= 0.2) return 1.0                              // Growth: full vibrancy
  if (p <= 0.4) return 1.0 - (p - 0.2) * 0.5           // Maintenance: 1.0 → 0.9
  if (p <= 0.6) return 0.9 - (p - 0.4) * 0.5           // Operations: 0.9 → 0.8
  if (p <= 0.8) return 0.8 - (p - 0.6) * 1.0           // Obligations: 0.8 → 0.6
  return 0.6 - (p - 0.8) * 1.0                         // Survival: 0.6 → 0.4
}

function tierGlassOpacity(p: number): number {
  if (p <= 0.2) return 0.45                             // Growth: max transparency
  if (p <= 0.4) return 0.45 + (p - 0.2) * 0.5          // Maintenance: 0.45 → 0.55
  if (p <= 0.6) return 0.55 + (p - 0.4) * 0.5          // Operations: 0.55 → 0.65
  if (p <= 0.8) return 0.65 + (p - 0.6) * 0.5          // Obligations: 0.65 → 0.75
  return 0.75 + (p - 0.8) * 0.5                        // Survival: 0.75 → 0.85
}

function tierParticleGravity(p: number): number {
  if (p <= 0.4) return 0                                // Growth + Maintenance: no gravity
  if (p <= 0.6) return (p - 0.4) * 1.0                 // Operations: 0 → 0.2
  if (p <= 0.8) return 0.2 + (p - 0.6) * 2.5           // Obligations: 0.2 → 0.7 (drift down)
  return 0.7 + (p - 0.8) * 1.5                         // Survival: 0.7 → 1.0
}

function tierConstellationVisibility(p: number): number {
  if (p <= 0.2) return 0.5                              // Growth: subtle
  if (p <= 0.6) return 0.5 + (p - 0.2) * 1.25          // Maintenance→Operations: 0.5 → 1.0
  if (p <= 0.8) return 1.0 - (p - 0.6) * 1.5           // Obligations: 1.0 → 0.7
  return 0.7 - (p - 0.8) * 2.0                         // Survival: 0.7 → 0.3 (only active)
}

export function useMetabolicPressure(): MetabolicValues {
  const rawPressure = useMotionValue(0)
  const pressure = useSpring(rawPressure, PRESSURE_SPRING)

  // ─── Five-tier derived transforms (zero re-renders) ───────────────

  const breathScale = useTransform(pressure, tierBreathScale)
  const driftScale = useTransform(pressure, tierDriftScale)
  const stiffnessBoost = useTransform(pressure, (p: number) => p * 30)
  const warmth = useTransform(pressure, tierWarmth)
  const auroraSaturation = useTransform(pressure, tierAuroraSaturation)
  const auroraIntensity = useTransform(pressure, tierAuroraIntensity)
  const glassOpacity = useTransform(pressure, tierGlassOpacity)
  const particleGravity = useTransform(pressure, tierParticleGravity)
  const constellationVisibility = useTransform(pressure, tierConstellationVisibility)

  return {
    pressure,
    breathScale,
    driftScale,
    stiffnessBoost,
    warmth,
    auroraSaturation,
    auroraIntensity,
    glassOpacity,
    particleGravity,
    constellationVisibility,
    /** @internal — exposed for the provider to feed WS data */
    _setRaw: rawPressure.set.bind(rawPressure),
  } as MetabolicValues & { _setRaw: (v: number) => void }
}

